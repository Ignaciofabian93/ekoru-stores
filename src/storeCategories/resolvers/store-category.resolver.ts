import {
  Resolver,
  Query,
  ResolveField,
  ResolveReference,
  Parent,
  Args,
  Context,
} from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import type {
  StoreCategory,
  StoreCategoryTranslation,
} from '../../types/store-category';
import type { StoreSubCategory } from '../../types/store-sub-category';
import type { GraphQLContext } from '../../types';
import {
  StoreCategoryEntity,
  StoreCategoryTranslationEntity,
  StoreCategoryProductsEntity,
} from '../entities';
import { StoreSubCategoryEntity } from '../../storeSubCategories/entities';
import {
  GetStoreCategoriesArgs,
  GetStoreCategoryByIdArgs,
  GetStoreCategoryBySlugArgs,
  GetStoreCategoryProductsByIdArgs,
  GetStoreCategoryProductsBySlugArgs,
} from '../dto';
import { StoreCategoryService } from '../store-category.service';
import { CurrentSeller } from '../../common/decorators';

/**
 * Store Category GraphQL Resolver
 *
 * This resolver handles all GraphQL queries and field resolutions for store categories.
 * It uses DataLoaders from the context to efficiently load translations and related data.
 *
 * Lookup conventions:
 * - by slug → web browsing (e.g. /moda)
 * - by id   → admin panel
 */
@Resolver(() => StoreCategoryEntity)
export class StoreCategoryResolver {
  private readonly logger = new Logger(StoreCategoryResolver.name);

  constructor(private readonly storeCategoryService: StoreCategoryService) {}

  /**
   * Query: Get all store categories with page-based pagination
   *
   * @example
   * query {
   *   getStoreCategories(page: 1, pageSize: 20, language: ES) {
   *     id
   *     translation { name }
   *   }
   * }
   */
  @Query(() => [StoreCategoryEntity])
  async getStoreCategories(
    @Args() { page, pageSize, language }: GetStoreCategoriesArgs,
    @Context() context: GraphQLContext,
  ): Promise<StoreCategory[]> {
    this.logger.debug(
      `Query: getStoreCategories(page: ${page}, pageSize: ${pageSize}, language: ${language})`,
    );

    // Override context language so field resolvers (translation, storeSubCategory)
    // use the same language the client explicitly requested.
    context.language = language;

    const storeCategories = await this.storeCategoryService.getStoreCategories({
      page,
      pageSize,
      language,
    });

    // Prime the translation cache for all store categories
    if (storeCategories.length > 0) {
      const storeCategoryIds = storeCategories.map((c) => c.id);
      await context.storeCategoryRepository.primeTranslations(
        context.loaders.storeCategoryTranslation,
        storeCategoryIds,
        language,
      );
    }

    return storeCategories;
  }

  /**
   * Query: Get a single store category by ID (admin panel)
   *
   * @example
   * query {
   *   getStoreCategoryById(id: 1, language: ES) {
   *     id
   *     translation { name }
   *     storeSubCategory { id translation { name } }
   *   }
   * }
   */
  @Query(() => StoreCategoryEntity, { nullable: true })
  async getStoreCategoryById(
    @Args() { id, language }: GetStoreCategoryByIdArgs,
    @Context() context: GraphQLContext,
  ): Promise<StoreCategory> {
    this.logger.debug(`Query: getStoreCategoryById(${id}, ${language})`);

    context.language = language;

    return this.storeCategoryService.getStoreCategoryById({ id, language });
  }

  /**
   * Query: Get a single store category by slug (web browsing)
   *
   * @example
   * query {
   *   getStoreCategoryBySlug(slug: "moda", language: ES) {
   *     id
   *     translation { name }
   *     storeSubCategory { id translation { name } }
   *   }
   * }
   */
  @Query(() => StoreCategoryEntity, { nullable: true })
  async getStoreCategoryBySlug(
    @Args() { slug, language }: GetStoreCategoryBySlugArgs,
    @Context() context: GraphQLContext,
  ): Promise<StoreCategory> {
    this.logger.debug(`Query: getStoreCategoryBySlug(${slug}, ${language})`);

    context.language = language;

    return this.storeCategoryService.getStoreCategoryBySlug({
      slug,
      language,
    });
  }

  /**
   * Query: Get a store category by ID along with its sub categories and the
   * paginated list of every product inside it (admin panel)
   *
   * @example
   * query {
   *   getStoreCategoryProductsById(id: 1, language: ES, page: 1, pageSize: 20) {
   *     storeCategory {
   *       id
   *       translation { name slug }
   *       storeSubCategory { id translation { name } }
   *     }
   *     products {
   *       nodes { id name price }
   *       pageInfo { totalCount totalPages hasNextPage }
   *     }
   *   }
   * }
   */
  @Query(() => StoreCategoryProductsEntity, { nullable: true })
  async getStoreCategoryProductsById(
    @Args()
    {
      id,
      language,
      page,
      pageSize,
      filter,
      sort,
    }: GetStoreCategoryProductsByIdArgs,
    @Context() context: GraphQLContext,
    @CurrentSeller() currentSellerId?: string,
  ) {
    this.logger.debug(
      `Query: getStoreCategoryProductsById(${id}, ${language}, page: ${page}, pageSize: ${pageSize})`,
    );

    // Override context language so nested field resolvers (e.g. sub category
    // translations) use the same language the client explicitly requested.
    context.language = language;

    return this.storeCategoryService.getStoreCategoryProductsById({
      id,
      language,
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId: currentSellerId,
    });
  }

  /**
   * Query: Get a store category by slug along with its sub categories and the
   * paginated list of every product inside it (web browsing)
   *
   * @example
   * query {
   *   getStoreCategoryProductsBySlug(slug: "moda", language: ES, page: 1, pageSize: 20) {
   *     storeCategory {
   *       id
   *       translation { name slug }
   *       storeSubCategory { id translation { name } }
   *     }
   *     products {
   *       nodes { id name price }
   *       pageInfo { totalCount totalPages hasNextPage }
   *     }
   *   }
   * }
   */
  @Query(() => StoreCategoryProductsEntity, { nullable: true })
  async getStoreCategoryProductsBySlug(
    @Args()
    {
      slug,
      language,
      page,
      pageSize,
      filter,
      sort,
    }: GetStoreCategoryProductsBySlugArgs,
    @Context() context: GraphQLContext,
    @CurrentSeller() currentSellerId?: string,
  ) {
    this.logger.debug(
      `Query: getStoreCategoryProductsBySlug(${slug}, ${language}, page: ${page}, pageSize: ${pageSize})`,
    );

    // Override context language so nested field resolvers (e.g. sub category
    // translations) use the same language the client explicitly requested.
    context.language = language;

    return this.storeCategoryService.getStoreCategoryProductsBySlug({
      slug,
      language,
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId: currentSellerId,
    });
  }

  /**
   * Field Resolver: translation
   *
   * Resolves the translation field for a store category using DataLoader.
   * Returns a SINGLE translation object based on the current language.
   */
  @ResolveField(() => StoreCategoryTranslationEntity, { nullable: true })
  async translation(
    @Parent() storeCategory: StoreCategory,
    @Context() context: GraphQLContext,
  ): Promise<StoreCategoryTranslation | null> {
    const language = context.language;

    this.logger.debug(
      `ResolveField: StoreCategory.translation(id: ${storeCategory.id}, language: ${language})`,
    );

    return context.storeCategoryRepository.getTranslation(
      context.loaders.storeCategoryTranslation,
      storeCategory.id,
      language,
    );
  }

  /**
   * Field Resolver: storeSubCategory
   *
   * Resolves the storeSubCategory field for a store category using DataLoader.
   * Returns an array of sub categories for this store category.
   */
  @ResolveField(() => [StoreSubCategoryEntity])
  async storeSubCategory(
    @Parent() storeCategory: StoreCategory,
    @Context() context: GraphQLContext,
  ): Promise<StoreSubCategory[]> {
    const language = context.language;

    this.logger.debug(
      `ResolveField: StoreCategory.storeSubCategory(id: ${storeCategory.id})`,
    );

    const subCategories = await context.loaders.storeSubCategories.load(
      storeCategory.id,
    );

    // Prime the translation cache for all sub categories
    if (subCategories.length > 0) {
      const subCategoryIds = subCategories.map((sc) => sc.id);
      await context.storeSubCategoryRepository.primeTranslations(
        context.loaders.storeSubCategoryTranslation,
        subCategoryIds,
        language,
      );
    }

    return subCategories;
  }

  /**
   * Reference resolver for Apollo Federation.
   * Allows other subgraphs to resolve a StoreCategory by ID.
   */
  @ResolveReference()
  async resolveReference(
    reference: { __typename: string; id: number },
    @Context() context: GraphQLContext,
  ): Promise<StoreCategory | null> {
    this.logger.debug(`ResolveReference: StoreCategory(id: ${reference.id})`);
    return context.loaders.storeCategoryById.load(reference.id);
  }
}
