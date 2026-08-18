import DataLoader from 'dataloader';
import { Request, Response } from 'express';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../common/i18n';
import { GraphQLContext } from '../types';
import { StoreCategoryRepository } from '../storeCategories/store-category.repository';
import { StoreCategoryService } from '../storeCategories/store-category.service';
import { StoreSubCategoryRepository } from '../storeSubCategories/store-sub-category.repository';
import { resolveIdentity } from '../common/identity';

/**
 * GraphQL Context Factory
 *
 * Creates a fresh context object for each request. Language is resolved once
 * from the Accept-Language header and stored in context.language. DataLoaders
 * are created fresh per request to prevent stale cache across requests.
 */
export function createGraphQLContext(
  req: Request,
  res: Response,
  moduleRef: ModuleRef,
): GraphQLContext {
  const prisma = moduleRef.get(PrismaService, { strict: false });
  const storeCategoryRepository = moduleRef.get(StoreCategoryRepository, {
    strict: false,
  });
  const storeCategoryService = moduleRef.get(StoreCategoryService, {
    strict: false,
  });
  const storeSubCategoryRepository = moduleRef.get(StoreSubCategoryRepository, {
    strict: false,
  });

  // Parse Accept-Language header once per request
  const i18nService = moduleRef.get(I18nService, { strict: false });
  const language = i18nService.parseAcceptLanguage(
    req.headers['accept-language'],
  );

  // Identity comes from the verified access token, not from the gateway's
  // x-seller-id / x-admin-id headers — those are unsigned and were
  // believed unconditionally. See ../common/identity.
  const { sellerId, adminId, adminRole, adminType, adminSellerId, token } =
    resolveIdentity(req.headers);

  // DataLoaders MUST be fresh per request to prevent stale cache
  const loaders = {
    storeCategoryTranslation: storeCategoryRepository.createTranslationLoader(),
    storeCategoryById: storeCategoryRepository.createStoreCategoryLoader(),
    storeSubCategoryTranslation:
      storeSubCategoryRepository.createTranslationLoader(),
    storeSubCategories:
      storeSubCategoryRepository.createStoreSubCategoryByCategoryLoader(),

    // Batches "did the current seller favorite these store products?" lookups
    // so grids resolve `isLiked` without an N+1. Anonymous → all false.
    storeProductLikedByMe: new DataLoader<number, boolean>(
      async (storeProductIds) => {
        if (!sellerId) return storeProductIds.map(() => false);
        const likes = await prisma.storeProductLike.findMany({
          where: {
            sellerId,
            storeProductId: { in: [...storeProductIds] },
          },
          select: { storeProductId: true },
        });
        const liked = new Set(likes.map((l) => l.storeProductId));
        return storeProductIds.map((id) => liked.has(id));
      },
    ),
  };

  return {
    req,
    res,
    language,
    prisma,
    storeCategoryService,
    storeCategoryRepository,
    storeSubCategoryRepository,
    loaders,
    sellerId,
    adminId,
    adminRole,
    adminType,
    adminSellerId,
    token,
  };
}

/**
 * Context factory wrapper for GraphQLModule configuration.
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
