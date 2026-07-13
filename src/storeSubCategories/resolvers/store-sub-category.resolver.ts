import {
  Resolver,
  Query,
  ResolveField,
  Parent,
  Context,
  Args,
} from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import type {
  StoreSubCategory,
  StoreSubCategoryTranslation,
} from '../../types/store-sub-category';
import type { GraphQLContext } from '../../types';
import {
  StoreSubCategoryEntity,
  StoreSubCategoryTranslationEntity,
  StoreSubCategoryProductsEntity,
} from '../entities';
import {
  GetStoreSubCategoriesArgs,
  GetStoreSubCategoryByIdArgs,
  GetStoreSubCategoryBySlugArgs,
  GetStoreSubCategoryProductsBySlugArgs,
} from '../dto';
import { StoreSubCategoryService } from '../store-sub-category.service';
import { CurrentSeller } from '../../common/decorators';

/**
 * Store Sub Category GraphQL Resolver
 *
 * This resolver handles queries and field resolutions for store sub categories.
 * It uses DataLoaders from the context to efficiently load translations.
 */
@Resolver(() => StoreSubCategoryEntity)
export class StoreSubCategoryResolver {
  private readonly logger = new Logger(StoreSubCategoryResolver.name);

  constructor(
    private readonly storeSubCategoryService: StoreSubCategoryService,
  ) {}

  /**
   * Query: Get all store sub categories with page-based pagination
   *
   * @example
   * query {
   *   getStoreSubCategories(page: 1, pageSize: 20, language: ES) {
   *     id
   *     translation { name }
   *   }
   * }
   */
  @Query(() => [StoreSubCategoryEntity])
  async getStoreSubCategories(
    @Args() { page, pageSize, language }: GetStoreSubCategoriesArgs,
    @Context() context: GraphQLContext,
  ): Promise<StoreSubCategory[]> {
    this.logger.debug(
      `Query: getStoreSubCategories(page: ${page}, pageSize: ${pageSize}, language: ${language})`,
    );

    // Override context language so field resolvers use the same language the client requested.
    context.language = language;

    const subCategories =
      await this.storeSubCategoryService.getStoreSubCategories({
        page,
        pageSize,
        language,
      });

    if (subCategories.length > 0) {
      const subCategoryIds = subCategories.map((sc) => sc.id);

      // Prime the translation cache for all sub categories
      await context.storeSubCategoryRepository.primeTranslations(
        context.loaders.storeSubCategoryTranslation,
        subCategoryIds,
        language,
      );
    }

    return subCategories;
  }

  /**
   * Query: Get a single store sub category by ID (admin panel)
   */
  @Query(() => StoreSubCategoryEntity, { nullable: true })
  async getStoreSubCategoryById(
    @Args() { id, language }: GetStoreSubCategoryByIdArgs,
    @Context() context: GraphQLContext,
  ): Promise<StoreSubCategory> {
    this.logger.debug(`Query: getStoreSubCategoryById(${id}, ${language})`);

    context.language = language;

    return this.storeSubCategoryService.getStoreSubCategoryById({
      id,
      language,
    });
  }

  /**
   * Query: Get a single store sub category by slug (web browsing)
   */
  @Query(() => StoreSubCategoryEntity, { nullable: true })
  async getStoreSubCategoryBySlug(
    @Args() { slug, language }: GetStoreSubCategoryBySlugArgs,
    @Context() context: GraphQLContext,
  ): Promise<StoreSubCategory> {
    this.logger.debug(`Query: getStoreSubCategoryBySlug(${slug}, ${language})`);

    context.language = language;

    return this.storeSubCategoryService.getStoreSubCategoryBySlug({
      slug,
      language,
    });
  }

  /**
   * Query: Get a store sub category by slug along with its paginated products
   * (web browsing). This is the most focused browsing level.
   *
   * On the first load select the full payload; when paginating select only
   * `products` so the sub category data is not re-resolved.
   *
   * @example
   * query {
   *   getStoreSubCategoryProductsBySlug(slug: "carteras", language: ES, page: 1, pageSize: 12) {
   *     storeSubCategory {
   *       id
   *       translation { name slug }
   *     }
   *     products {
   *       nodes { id name price }
   *       pageInfo { totalCount totalPages hasNextPage }
   *     }
   *   }
   * }
   */
  @Query(() => StoreSubCategoryProductsEntity, { nullable: true })
  async getStoreSubCategoryProductsBySlug(
    @Args()
    {
      slug,
      language,
      page,
      pageSize,
      filter,
      sort,
    }: GetStoreSubCategoryProductsBySlugArgs,
    @Context() context: GraphQLContext,
    @CurrentSeller() currentSellerId?: string,
  ) {
    this.logger.debug(
      `Query: getStoreSubCategoryProductsBySlug(${slug}, ${language}, page: ${page}, pageSize: ${pageSize})`,
    );

    // Override context language so field resolvers use the same language the client requested.
    context.language = language;

    return this.storeSubCategoryService.getStoreSubCategoryProductsBySlug({
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
   * Resolves the translation field for a store sub category using DataLoader.
   * Returns a SINGLE translation object based on the current language.
   */
  @ResolveField(() => StoreSubCategoryTranslationEntity, { nullable: true })
  async translation(
    @Parent() storeSubCategory: StoreSubCategory,
    @Context() context: GraphQLContext,
  ): Promise<StoreSubCategoryTranslation | null> {
    const language = context.language;

    this.logger.debug(
      `ResolveField: StoreSubCategory.translation(id: ${storeSubCategory.id}, language: ${language})`,
    );

    return context.storeSubCategoryRepository.getTranslation(
      context.loaders.storeSubCategoryTranslation,
      storeSubCategory.id,
      language,
    );
  }
}
