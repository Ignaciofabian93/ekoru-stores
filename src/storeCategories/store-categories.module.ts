import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { StoreCategoryRepository } from './store-category.repository';
import { StoreCategoryService } from './store-category.service';
import { StoreCategoryResolver } from './resolvers';
import { I18nStoreCategoryService } from './i18n';

/**
 * Store Categories Module
 *
 * Self-contained subdomain module for store categories:
 * - Repository layer with DataLoader pattern for N+1 prevention
 * - Service layer with business logic (by id for admin, by slug for web,
 *   plus combined store category + products queries)
 * - GraphQL resolver with field-level resolution
 * - Subdomain-scoped I18N service
 */
@Module({
  imports: [PrismaModule, ProductsModule],
  providers: [
    I18nStoreCategoryService,
    StoreCategoryRepository,
    StoreCategoryService,
    StoreCategoryResolver,
  ],
  exports: [
    I18nStoreCategoryService,
    StoreCategoryRepository,
    StoreCategoryService,
  ],
})
export class StoreCategoriesModule {}
