import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundError,
  InternalServerError,
} from '../common/exceptions/graphql.exceptions';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMarketCatalog() {
    try {
      const departments = await this.prisma.department.findMany({
        select: {
          id: true,
          departmentName: true,
          href: true,
          departmentCategory: {
            select: {
              id: true,
              departmentCategoryName: true,
              href: true,
              productCategory: {
                select: {
                  id: true,
                  productCategoryName: true,
                  departmentCategoryId: true,
                  href: true,
                },
              },
            },
          },
        },
        orderBy: {
          departmentName: 'asc',
        },
      });

      if (!departments.length) {
        throw new NotFoundError('No se encontraron departamentos');
      }

      return departments;
    } catch (error) {
      this.logger.error('Error al obtener el catálogo del mercado:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(
        'Error al obtener el catálogo del mercado',
      );
    }
  }

  async getStoreCatalog() {
    try {
      const storeCatalog = await this.prisma.storeCategory.findMany({
        select: {
          id: true,
          category: true,
          href: true,
          subcategories: {
            select: {
              id: true,
              subCategory: true,
            },
          },
        },
        orderBy: {
          category: 'asc',
        },
      });

      if (!storeCatalog.length) {
        throw new NotFoundError('No se encontraron categorías de tienda');
      }

      return storeCatalog;
    } catch (error) {
      this.logger.error('Error al obtener el catálogo de tiendas:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Error al obtener el catálogo de tiendas');
    }
  }
}
