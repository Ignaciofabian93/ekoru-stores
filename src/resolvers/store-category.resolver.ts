import {
  Resolver,
  Query,
  ResolveField,
  Parent,
  Args,
  Context,
  Int,
} from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { Language, StoreSubCategory } from '@prisma/client';
import type {
  StoreCategory,
  StoreCategoryTranslation,
} from '../types/store-category';
import { StoreCategoryEntity } from '../catalog-v2/entities/store-category.entity';
import type { GraphQLContext } from '../types';
import { StoreCategoryService } from '../services/store-category.service';
import { StoreCategoryTranslationEntity } from '../catalog-v2/entities/store-category-translation.entity';
import { StoreSubCategoryEntity } from '../catalog-v2/entities/store-sub-category.entity';

/**
 * Store Category GraphQL Resolver
 *
 * This resolver handles all GraphQL queries and field resolutions for store categories.
 * It uses DataLoaders from the context to efficiently load translations and related data.
 */
@Resolver(() => StoreCategoryEntity)
export class StoreCategoryResolver {
  private readonly logger = new Logger(StoreCategoryResolver.name);

  constructor(private readonly storeCategoryService: StoreCategoryService) {}

  /**
   * Query: Get store category by slug
   *
   * @example
   * query {
   *   getStoreCategoryBySlug(slug: "tecnologia", language: ES) {
   *     id
   *     translation { name slug }
   *   }
   * }
   */
  @Query(() => StoreCategoryEntity, { nullable: true })
  async getStoreCategoryBySlug(
    @Args('slug') slug: string,
    @Args('language', { type: () => Language }) language: Language,
    @Context() context: GraphQLContext,
  ): Promise<StoreCategory> {
    this.logger.debug(
      `Query: getStoreCategoryBySlug - slug: ${slug}, language: ${language}`,
    );

    context.language = language;

    return this.storeCategoryService.getStoreCategoryBySlug(slug, language);
  }

  /**
   * Query: Get all store categories with pagination
   *
   * @example
   * query {
   *   getStoreCategories(limit: 10, offset: 0, language: ES) {
   *     id
   *     translation { name }
   *   }
   * }
   */
  @Query(() => [StoreCategoryEntity])
  async getStoreCategories(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('language', { type: () => Language, defaultValue: Language.ES })
    language: Language,
    @Context() context: GraphQLContext,
  ): Promise<StoreCategory[]> {
    this.logger.debug(
      `Query: getStoreCategories - limit: ${limit}, offset: ${offset}, language: ${language}`,
    );

    context.language = language;

    const storeCategories = await this.storeCategoryService.getStoreCategories(
      limit,
      offset,
      language,
    );

    if (storeCategories.length > 0) {
      const storeCategoryIds = storeCategories.map((cat) => cat.id);
      await context.storeCategoryRepository.primeTranslations(
        context.loaders.storeCategoryTranslation,
        storeCategoryIds,
        language,
      );
    }

    return storeCategories;
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
      `ResolveField: translation - storeCategoryId: ${storeCategory.id}, language: ${language}`,
    );

    return context.storeCategoryRepository.getTranslation(
      context.loaders.storeCategoryTranslation,
      storeCategory.id,
      language,
    );
  }

  /**
   * Field Resolver: storeSubCategories
   *
   * Resolves the storeSubCategories field for a store category using DataLoader.
   * Returns an array of subcategories for this store category.
   */
  @ResolveField(() => [StoreSubCategoryEntity])
  async storeSubCategory(
    @Parent() storeCategory: StoreCategory,
    @Context() context: GraphQLContext,
  ): Promise<StoreSubCategory[]> {
    const language = context.language;

    this.logger.debug(
      `ResolveField: StoreCategory.storeSubCategory(id: ${storeCategory.id}) - language: ${language}`,
    );

    const subCategories = await context.loaders.storeSubCategories.load(
      storeCategory.id,
    );

    if (subCategories.length > 0) {
      const categoryIds = subCategories.map((subCat) => subCat.id);
      await context.storeSubCategoryRepository.primeTranslations(
        context.loaders.storeSubCategoryTranslation,
        categoryIds,
        language,
      );
    }

    return subCategories;
  }
}
