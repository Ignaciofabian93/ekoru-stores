import DataLoader from 'dataloader';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { Language } from '@prisma/client';
import { I18nService } from '../common/i18n';
import { StoreCategory, StoreCategoryTranslation } from './store-category';
import {
  StoreSubCategory,
  StoreSubCategoryTranslation,
} from './store-sub-category';
import { StoreCategoryService } from '../services/store-category.service';
import { StoreCategoryRepository } from '../repositories/store-category.repository';
import { StoreSubCategoryRepository } from '../repositories/store-sub-category.repository';
import { CatalogRepository } from 'src/repositories/catalog.repository';

/**
 * GraphQL Context Interface
 *
 * This interface defines the context object that is available to all resolvers.
 * The context is created per request and includes:
 * - DataLoaders for batch loading and caching
 * - Service instances
 * - Repository instances
 * - Request metadata (language, user, etc.)
 */
export interface GraphQLContext {
  // Express Request/Response
  req: Request;
  res: Response;

  // Current language for this request
  language: Language;

  // Prisma Client
  prisma: PrismaService;

  // Services
  storeCategoryService: StoreCategoryService;
  i18nService: I18nService;

  // Repositories
  catalogRepository: CatalogRepository;
  storeCategoryRepository: StoreCategoryRepository;
  storeSubCategoryRepository: StoreSubCategoryRepository;

  // DataLoaders - Fresh per request to prevent stale data
  loaders: {
    // Department loaders
    storeCategoryTranslation: DataLoader<
      string,
      StoreCategoryTranslation | null
    >;
    storeCategoryById: DataLoader<number, StoreCategory | null>;
    storeSubCategories: DataLoader<number, StoreSubCategory[]>;

    // Product Category loaders
    storeSubCategoryTranslation: DataLoader<
      string,
      StoreSubCategoryTranslation | null
    >;
    storeSubCategoriesByStoreCategory: DataLoader<number, StoreSubCategory[]>;
  };

  // Optional: Authenticated seller ID (from x-seller-id header)
  sellerId?: string;

  // Optional: Auth token
  token?: string;
}

/**
 * Type guard to ensure context has all required properties
 */
export function isValidGraphQLContext(context: any): context is GraphQLContext {
  return (
    context &&
    typeof context === 'object' &&
    'loaders' in context &&
    'language' in context &&
    'prisma' in context
  );
}
