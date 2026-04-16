import {
  Resolver,
  ResolveField,
  Parent,
  Context,
  Query,
  Int,
  Args,
} from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import type {
  StoreSubCategory,
  StoreSubCategoryTranslation,
} from '../types/store-sub-category';
import type { GraphQLContext } from '../types';
import {
  StoreSubCategoryEntity,
  StoreSubCategoryTranslationEntity,
} from '../catalog-v2/entities';
import { Language } from '../graphql/enums';
import { StoreSubCategoryService } from '../services/store-sub-category.service';

@Resolver(() => StoreSubCategoryEntity)
export class StoreSubCategoryResolver {
  private readonly logger = new Logger(StoreSubCategoryResolver.name);

  constructor(
    private readonly storeSubCategoryService: StoreSubCategoryService,
  ) {}

  /**
   * Query: Get store sub category by slug
   *
   * @example
   * query {
   *   getStoreSubCategoryBySlug(slug: "led-grande", language: ES) {
   *     id
   *     translation { name slug }
   *   }
   * }
   */
  @Query(() => StoreSubCategoryEntity, { nullable: true })
  async getStoreSubCategoryBySlug(
    @Args('slug') slug: string,
    @Args('language', { type: () => Language, nullable: true })
    language: Language,
    @Context() context: GraphQLContext,
  ): Promise<StoreSubCategory> {
    this.logger.debug(
      `Query: getStoreSubCategoryBySlug with slug: ${slug} and language: ${language}`,
    );

    context.language = language;

    return this.storeSubCategoryService.getStoreSubCategoryBySlug(
      slug,
      language,
    );
  }

  /**
   * Query: Get all store sub categories with pagination
   *
   * @example
   * query {
   *   getStoreSubCategories(limit: 10, offset: 0, language: ES) {
   *     id
   *     translation { name }
   *   }
   * }
   */
  @Query(() => [StoreSubCategoryEntity])
  async getStoreSubCategories(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('language', { type: () => Language, defaultValue: Language.ES })
    language: Language,
    @Context() context: GraphQLContext,
  ): Promise<StoreSubCategory[]> {
    this.logger.debug(
      `Query: getStoreSubCategories with limit: ${limit}, offset: ${offset}, language: ${language}`,
    );

    context.language = language;

    const storeSubCategories =
      await this.storeSubCategoryService.getStoreSubCategories(
        limit,
        offset,
        language,
      );

    if (storeSubCategories.length > 0) {
      const categoryIds = storeSubCategories.map((cat) => cat.id);

      await context.storeSubCategoryRepository.primeTranslations(
        context.loaders.storeSubCategoryTranslation,
        categoryIds,
        language,
      );
    }

    return storeSubCategories;
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
      `Resolving translation for StoreSubCategory ID: ${storeSubCategory.id} in language: ${language}`,
    );

    return context.storeSubCategoryRepository.getTranslation(
      context.loaders.storeSubCategoryTranslation,
      storeSubCategory.id,
      language,
    );
  }
}
