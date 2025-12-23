import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundError,
  InternalServerError,
} from '../common/exceptions/graphql.exceptions';

@Injectable()
export class StoreCatalogService {
  private readonly logger = new Logger(StoreCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

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
