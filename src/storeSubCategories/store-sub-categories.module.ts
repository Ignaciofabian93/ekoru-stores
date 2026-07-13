import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { StoreSubCategoryRepository } from './store-sub-category.repository';
import { StoreSubCategoryService } from './store-sub-category.service';
import { StoreSubCategoryResolver } from './resolvers';
import { I18nStoreSubCategoryService } from './i18n';

/**
 * Store Sub Categories Module
 *
 * Self-contained subdomain module for store sub categories:
 * - Repository layer with DataLoader pattern for N+1 prevention
 * - Service layer with business logic (by id for admin, by slug for web,
 *   plus combined sub category + products queries)
 * - GraphQL resolver with field-level resolution
 * - Subdomain-scoped I18N service
 */
@Module({
  imports: [PrismaModule, ProductsModule],
  providers: [
    I18nStoreSubCategoryService,
    StoreSubCategoryRepository,
    StoreSubCategoryService,
    StoreSubCategoryResolver,
  ],
  exports: [
    I18nStoreSubCategoryService,
    StoreSubCategoryRepository,
    StoreSubCategoryService,
  ],
})
export class StoreSubCategoriesModule {}
