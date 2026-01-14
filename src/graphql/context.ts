import { Request, Response } from 'express';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../common/i18n';
import { GraphQLContext } from '../types';
import { CatalogRepository } from 'src/repositories/catalog.repository';
import { StoreCategoryRepository } from 'src/repositories/store-category.repository';
import { StoreCategoryService } from 'src/services/store-category.service';
import { StoreSubCategoryRepository } from 'src/repositories/store-sub-category.repository';

/**
 * GraphQL Context Factory
 *
 * This factory function creates a fresh GraphQL context for each request.
 * It initializes DataLoaders, services, and extracts metadata from the request.
 *
 * CRITICAL: DataLoaders MUST be created fresh per request to prevent stale cache
 * and ensure data consistency across requests.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {ModuleRef} moduleRef - NestJS module reference for dependency injection
 * @returns {GraphQLContext} The context object for this request
 */
export function createGraphQLContext(
  req: Request,
  res: Response,
  moduleRef: ModuleRef,
): GraphQLContext {
  // Resolve services and repositories from the NestJS DI container
  const prisma = moduleRef.get(PrismaService, { strict: false });
  const catalogRepository = moduleRef.get(CatalogRepository, {
    strict: false,
  });
  const storeCategoryRepository = moduleRef.get(StoreCategoryRepository, {
    strict: false,
  });
  const storeCategoryService = moduleRef.get(StoreCategoryService, {
    strict: false,
  });
  const storeSubCategoryRepository = moduleRef.get(StoreSubCategoryRepository, {
    strict: false,
  });

  const i18nService = moduleRef.get(I18nService, { strict: false });

  // Extract language from Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  const language = i18nService.parseAcceptLanguage(acceptLanguage);

  // Extract seller ID and token from headers
  const sellerId = req.headers['x-seller-id'] as string | undefined;
  const token = req.headers.authorization?.replace('Bearer ', '');

  // Create fresh DataLoaders for this request
  const loaders = {
    storeCatalog: catalogRepository.createTranslationLoader(),
    // Store Category loaders
    storeCategoryTranslation: storeCategoryRepository.createTranslationLoader(),
    storeCategoryById: storeCategoryRepository.createStoreCategoryLoader(),

    // Store Sub Category loaders
    storeSubCategoryTranslation:
      storeSubCategoryRepository.createTranslationLoader(),
    storeSubCategories:
      storeSubCategoryRepository.createStoreSubCategoryByCategoryLoader(),
    storeSubCategoriesByStoreCategory:
      storeSubCategoryRepository.createStoreSubCategoryByCategoryLoader(),
  };

  return {
    req,
    res,
    language,
    prisma,
    i18nService,
    storeCategoryService,
    catalogRepository,
    storeCategoryRepository,
    storeSubCategoryRepository,
    loaders,
    sellerId,
    token,
  };
}

/**
 * Context factory wrapper for use in GraphQLModule configuration
 *
 * This function returns a context factory that can be used in the GraphQL module
 * configuration. It provides access to the NestJS ModuleRef for dependency injection.
 *
 * @example
 * GraphQLModule.forRoot({
 *   context: createContextFactory(moduleRef),
 * })
 */
export function createContextFactory(moduleRef: ModuleRef) {
  return ({ req, res }: { req: Request; res: Response }): GraphQLContext => {
    return createGraphQLContext(req, res, moduleRef);
  };
}
