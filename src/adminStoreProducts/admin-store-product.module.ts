import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminStoreProductService } from './admin-store-product.service';
import { AdminStoreProductResolver } from './resolvers';

/**
 * Admin Store Product Module
 *
 * Platform-admin CRUD surface over StoreProduct: raw paginated reads (whole
 * catalog, inactive/soft-deleted included), bulk upserts for XLSX import /
 * row-by-row editing, and a hard delete. Sibling of AdminCatalogModule; reuses
 * its shared `StoreBulkUpsertResult` GraphQL type.
 */
@Module({
  imports: [PrismaModule],
  providers: [AdminStoreProductService, AdminStoreProductResolver],
  exports: [AdminStoreProductService],
})
export class AdminStoreProductModule {}
