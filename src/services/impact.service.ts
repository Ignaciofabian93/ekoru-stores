import { Injectable, Logger } from '@nestjs/common';
import { ImpactRepository } from '../repositories/impact.repository';
import {
  EnvironmentalImpactEntity,
  MaterialBreakdown,
} from '../products/entities/environmental-impact.entity';

/**
 * Impact Service
 *
 * Calculates environmental impact for product categories based on
 * their material composition and impact estimates.
 */
@Injectable()
export class ImpactService {
  private readonly logger = new Logger(ImpactService.name);

  constructor(private readonly impactRepository: ImpactRepository) {}

  /**
   * Calculate total environmental impact for a store subcategory
   *
   * Aggregates CO2 and water savings across all materials in the subcategory
   * based on their quantities and impact estimates.
   */
  async calculateSubCategoryImpact(
    storeSubCategoryId: number,
  ): Promise<EnvironmentalImpactEntity | null> {
    try {
      // Get all materials for this store subcategory
      const categoryMaterials =
        await this.impactRepository.getStoreProductMaterials(
          storeSubCategoryId,
        );

      if (!categoryMaterials || categoryMaterials.length === 0) {
        this.logger.debug(
          `No materials found for subcategory ${storeSubCategoryId}`,
        );
        return null;
      }

      let totalCo2SavingsKG = 0;
      let totalWaterSavingsLT = 0;
      const materialBreakdown: MaterialBreakdown[] = [];

      // Calculate impact for each material
      for (const categoryMaterial of categoryMaterials) {
        if (!categoryMaterial.material) {
          this.logger.warn(
            `Material ${categoryMaterial.materialTypeId} has no impact data`,
          );
          continue;
        }

        const material = categoryMaterial.material;
        const quantity = categoryMaterial.quantity;

        // Calculate impact based on quantity
        // Assuming the estimates are per unit (e.g., per kg or per 100%)
        const multiplier =
          categoryMaterial.unit === 'percentage' ? quantity / 100 : quantity;

        const co2Savings = material.estimatedCo2SavingsKG * multiplier;
        const waterSavings = material.estimatedWaterSavingsLT * multiplier;

        totalCo2SavingsKG += co2Savings;
        totalWaterSavingsLT += waterSavings;

        materialBreakdown.push({
          materialType: material.materialType,
          quantity: categoryMaterial.quantity,
          unit: categoryMaterial.unit,
          co2SavingsKG: co2Savings,
          waterSavingsLT: waterSavings,
        });
      }

      return {
        totalCo2SavingsKG: Math.round(totalCo2SavingsKG * 100) / 100, // Round to 2 decimals
        totalWaterSavingsLT: Math.round(totalWaterSavingsLT * 100) / 100,
        materialBreakdown,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating impact for subcategory ${storeSubCategoryId}:`,
        error,
      );
      return null;
    }
  }
}
