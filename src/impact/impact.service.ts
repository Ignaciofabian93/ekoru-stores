import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundError,
  InternalServerError,
} from '../common/exceptions/graphql.exceptions';

interface ProductCategoryMaterial {
  id: number;
  productCategoryId: number;
  materialTypeId: number;
  quantity: number;
  unit: string;
  isPrimary: boolean;
  material: {
    id: number;
    materialType: string;
    estimatedCo2SavingsKG: number;
    estimatedWaterSavingsLT: number;
  };
}

@Injectable()
export class ImpactService {
  private readonly logger = new Logger(ImpactService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMaterialImpacts() {
    try {
      const materials = await this.prisma.materialImpactEstimate.findMany({
        select: {
          id: true,
          materialType: true,
          estimatedCo2SavingsKG: true,
          estimatedWaterSavingsLT: true,
        },
        orderBy: {
          materialType: 'asc',
        },
      });

      if (!materials.length) {
        throw new NotFoundError(
          'No se encontraron materiales con datos de impacto.',
        );
      }

      return materials;
    } catch (error) {
      this.logger.error(
        'Error al obtener los datos de impacto de materiales:',
        error,
      );
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(
        'Error al obtener los datos de impacto de materiales',
      );
    }
  }

  async getAllCo2ImpactMessages() {
    try {
      const messages = await this.prisma.co2ImpactMessage.findMany({
        orderBy: {
          min: 'asc',
        },
      });

      if (!messages.length) {
        throw new NotFoundError(
          'No se encontraron mensajes de impacto de CO2.',
        );
      }

      return messages;
    } catch (error) {
      this.logger.error(
        'Error al obtener los mensajes de impacto de CO2:',
        error,
      );
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(
        'Error al obtener los mensajes de impacto de CO2',
      );
    }
  }

  async getAllWaterImpactMessages() {
    try {
      const messages = await this.prisma.waterImpactMessage.findMany({
        orderBy: {
          min: 'asc',
        },
      });

      if (!messages.length) {
        throw new NotFoundError(
          'No se encontraron mensajes de impacto de agua.',
        );
      }

      return messages;
    } catch (error) {
      this.logger.error(
        'Error al obtener los mensajes de impacto de agua:',
        error,
      );
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(
        'Error al obtener los mensajes de impacto de agua',
      );
    }
  }

  async calculateCategoryImpact(productCategoryId: number) {
    try {
      const category = await this.prisma.productCategory.findUnique({
        where: { id: productCategoryId },
        include: {
          materials: {
            include: {
              material: true,
            },
          },
        },
      });

      if (!category) {
        throw new NotFoundError('Categoría de producto no encontrada.');
      }

      if (!category.materials.length) {
        return {
          totalCo2SavingsKG: 0,
          totalWaterSavingsLT: 0,
          materialBreakdown: [],
        };
      }

      const averageWeight = category.averageWeight || 0;
      let totalCo2SavingsKG = 0;
      let totalWaterSavingsLT = 0;

      const materialBreakdown = category.materials.map(
        (mat: ProductCategoryMaterial) => {
          const materialWeightKG =
            mat.unit === 'percentage'
              ? (averageWeight * mat.quantity) / 100
              : mat.quantity;

          const co2SavingsKG =
            materialWeightKG * mat.material.estimatedCo2SavingsKG;
          const waterSavingsLT =
            materialWeightKG * mat.material.estimatedWaterSavingsLT;

          totalCo2SavingsKG += co2SavingsKG;
          totalWaterSavingsLT += waterSavingsLT;

          return {
            materialType: mat.material.materialType,
            percentage:
              mat.unit === 'percentage'
                ? mat.quantity
                : (mat.quantity / averageWeight) * 100,
            weightKG: materialWeightKG,
            co2SavingsKG,
            waterSavingsLT,
          };
        },
      );

      return {
        totalCo2SavingsKG: parseFloat(totalCo2SavingsKG.toFixed(2)),
        totalWaterSavingsLT: parseFloat(totalWaterSavingsLT.toFixed(2)),
        materialBreakdown,
      };
    } catch (error) {
      this.logger.error('Error al calcular el impacto ambiental:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Error al calcular el impacto ambiental');
    }
  }

  async calculateSubcategoryImpact(subcategoryId: number) {
    try {
      const subcategory = await this.prisma.storeSubCategory.findUnique({
        where: { id: subcategoryId },
        include: {
          materials: {
            include: {
              material: true,
            },
          },
        },
      });

      if (!subcategory) {
        throw new NotFoundError('Subcategoría no encontrada.');
      }

      if (!subcategory.materials.length) {
        return {
          totalCo2SavingsKG: 0,
          totalWaterSavingsLT: 0,
          materialBreakdown: [],
        };
      }

      let totalCo2SavingsKG = 0;
      let totalWaterSavingsLT = 0;

      const materialBreakdown = subcategory.materials.map((mat) => {
        const materialWeightKG =
          mat.unit === 'percentage' ? mat.quantity / 100 : mat.quantity;

        const co2SavingsKG =
          materialWeightKG * mat.material.estimatedCo2SavingsKG;
        const waterSavingsLT =
          materialWeightKG * mat.material.estimatedWaterSavingsLT;

        totalCo2SavingsKG += co2SavingsKG;
        totalWaterSavingsLT += waterSavingsLT;

        return {
          materialType: mat.material.materialType,
          sourceMaterial: mat.sourceMaterial,
          percentage: mat.unit === 'percentage' ? mat.quantity : null,
          weightKG: materialWeightKG,
          co2SavingsKG,
          waterSavingsLT,
          recycledPercentage: mat.recycledPercentage,
          isRecycled: mat.isRecycled,
        };
      });

      return {
        totalCo2SavingsKG: parseFloat(totalCo2SavingsKG.toFixed(2)),
        totalWaterSavingsLT: parseFloat(totalWaterSavingsLT.toFixed(2)),
        materialBreakdown,
      };
    } catch (error) {
      this.logger.error(
        'Error al calcular el impacto ambiental de subcategoría:',
        error,
      );
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Error al calcular el impacto ambiental');
    }
  }
}
