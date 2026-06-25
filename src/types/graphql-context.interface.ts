import DataLoader from 'dataloader';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { Language } from '@prisma/client';
import { StoreCategory, StoreCategoryTranslation } from './store-category';
import {
  StoreSubCategory,
  StoreSubCategoryTranslation,
} from './store-sub-category';
import { StoreCategoryService } from '../services/store-category.service';
import { StoreCategoryRepository } from '../repositories/store-category.repository';
import { StoreSubCategoryRepository } from '../repositories/store-sub-category.repository';

/**
 * GraphQL Context Interface
 *
 * Defines the per-request context available to all resolvers.
 *
 * `language` is resolved from the Accept-Language header and can be overridden
 * by resolvers that accept an explicit `language` argument (e.g. `context.language = language`).
 * Mutating this plain object is safe because context is fresh per request.
 */
export interface GraphQLContext {
  req: Request;
  res: Response;

  // Mutable per-request — resolvers may override for explicit language args
  language: Language;

  prisma: PrismaService;

  // Services
  storeCategoryService: StoreCategoryService;

  // Repositories
  storeCategoryRepository: StoreCategoryRepository;
  storeSubCategoryRepository: StoreSubCategoryRepository;

  // DataLoaders - Fresh per request to prevent stale data
  loaders: {
    storeCategoryTranslation: DataLoader<
      string,
      StoreCategoryTranslation | null
    >;
    storeCategoryById: DataLoader<number, StoreCategory | null>;
    storeSubCategories: DataLoader<number, StoreSubCategory[]>;
    storeSubCategoryTranslation: DataLoader<
      string,
      StoreSubCategoryTranslation | null
    >;

    // Whether the current seller has favorited a store product (by id).
    storeProductLikedByMe: DataLoader<number, boolean>;
  };

  sellerId?: string;
  adminId?: string;
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
