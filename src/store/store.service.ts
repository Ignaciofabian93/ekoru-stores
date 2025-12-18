import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundError,
  InternalServerError,
} from '../common/exceptions/graphql.exceptions';
import {
  calculatePrismaParams,
  createPaginatedResponse,
} from '../common/utils/pagination';

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStoreCategories() {
    try {
      const categories = await this.prisma.storeCategory.findMany();

      if (!categories) {
        throw new NotFoundError('No se han encontrado categorías de tienda');
      }

      return categories;
    } catch (error) {
      this.logger.error(
        'Error al intentar obtener las categorías de tienda',
        error,
      );
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(
        'Error al intentar obtener las categorías de tienda',
      );
    }
  }

  async getStoreSubCategoriesByCategoryId(storeCategoryId: number) {
    try {
      const parsedId = Number(storeCategoryId);

      const subcategories = await this.prisma.storeSubCategory.findMany({
        where: {
          storeCategoryId: parsedId,
        },
      });

      if (!subcategories) {
        throw new NotFoundError('No se han encontrado subcategorias');
      }

      return subcategories;
    } catch (error) {
      this.logger.error('Error al intentar obtener subcategorias: ', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(
        'Error al intentar obtener subcategorias según categoría seleccionada',
      );
    }
  }

  async getStoreCategory(
    id: number,
    page: number = 1,
    pageSize: number = 20,
  ) {
    try {
      const parsedId = Number(id);
      const { skip, take } = calculatePrismaParams(page, pageSize);

      const category = await this.prisma.storeCategory.findFirst({
        where: {
          id: parsedId,
        },
        select: {
          id: true,
          category: true,
          href: true,
          subcategories: {
            select: {
              id: true,
              subCategory: true,
              storeCategory: {
                select: {
                  id: true,
                  category: true,
                  href: true,
                },
              },
              href: true,
              _count: {
                select: {
                  storeProducts: true,
                },
              },
            },
            orderBy: {
              subCategory: 'asc',
            },
          },
        },
        orderBy: {
          category: 'asc',
        },
      });

      if (!category) {
        throw new NotFoundError('Categoría de tienda no encontrada.');
      }

      const totalProductsCount = await this.prisma.storeProduct.count({
        where: {
          storeSubCategory: {
            storeCategoryId: parsedId,
          },
          isActive: true,
          deletedAt: null,
        },
      });

      const products = await this.prisma.storeProduct.findMany({
        where: {
          storeSubCategory: {
            storeCategoryId: parsedId,
          },
          isActive: true,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      });

      return {
        ...category,
        products: createPaginatedResponse(products, page, pageSize, totalProductsCount),
      };
    } catch (error) {
      this.logger.error(
        'Error al intentar obtener la categoría de tienda:',
        error,
      );
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(
        'No se pudo obtener la categoría de tienda.',
      );
    }
  }

  async getStoreSubCategory(id: number) {
    try {
      const parsedId = Number(id);

      const subcategory = await this.prisma.storeSubCategory.findUnique({
        where: { id: parsedId },
        include: {
          storeCategory: true,
        },
      });

      if (!subcategory) {
        throw new NotFoundError('Subcategoría de tienda no encontrada.');
      }

      return subcategory;
    } catch (error) {
      this.logger.error(
        'Error al intentar obtener la subcategoría de tienda:',
        error,
      );
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(
        'No se pudo obtener la subcategoría de tienda.',
      );
    }
  }

  async getStoreSubCategories(
    storeCategoryId: number,
    page: number = 1,
    pageSize: number = 20,
  ) {
    try {
      const parsedId = Number(storeCategoryId);
      const { skip, take } = calculatePrismaParams(page, pageSize);

      const totalCount = await this.prisma.storeSubCategory.count({
        where: { storeCategoryId: parsedId },
      });

      const subcategories = await this.prisma.storeSubCategory.findMany({
        where: { storeCategoryId: parsedId },
        include: {
          storeCategory: true,
        },
        orderBy: {
          subCategory: 'asc',
        },
        skip,
        take,
      });

      return createPaginatedResponse(subcategories, page, pageSize, totalCount);
    } catch (error) {
      this.logger.error(
        'Error al intentar obtener las subcategorías de tienda:',
        error,
      );
      throw new InternalServerError(
        'No se pudieron obtener las subcategorías de tienda.',
      );
    }
  }
}
