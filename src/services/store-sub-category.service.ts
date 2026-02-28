import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Language } from '@prisma/client';
import { I18nService } from '../common/i18n';
import { StoreSubCategoryRepository } from '../repositories/store-sub-category.repository';
import { StoreSubCategory } from '../types/store-sub-category';

@Injectable()
export class StoreSubCategoryService {
  private readonly logger = new Logger(StoreSubCategoryService.name);

  constructor(
    private readonly storeSubCategoryRepository: StoreSubCategoryRepository,
    private readonly i18nService: I18nService,
  ) {}

  /**
   * Gets a store sub category by its slug
   *
   * @param {string} slug - The store sub category slug
   * @param {Language} language - The language for translation (optional, uses context if not provided)
   * @returns {Promise<StoreSubCategory>} The store sub category
   * @throws {NotFoundException} If store sub category is not found
   *
   * @example
   * const dept = await getStoreSubCategoryBySlug('led-grande', Language.ES);
   */
  async getStoreSubCategoryBySlug(
    slug: string,
    language?: Language,
  ): Promise<StoreSubCategory> {
    const lang = language ?? this.i18nService.getDefaultLanguage();

    this.logger.debug(
      `Fetching store sub category with slug: ${slug} in language: ${lang}`,
    );

    const storeSubCategory = await this.storeSubCategoryRepository.findBySlug(
      slug,
      lang,
    );

    if (!storeSubCategory) {
      throw new NotFoundException(
        `Store sub category with slug '${slug}' not found for language '${lang}'`,
      );
    }

    return storeSubCategory;
  }

  /**
   * Gets all store sub categories with pagination
   *
   * @param {number} limit - Maximum number of store sub categories to return (default: 20)
   * @param {number} offset - Number of store sub categories to skip (default: 0)
   * @param {Language} language - The language for translations (optional, uses context if not provided)
   * @returns {Promise<StoreSubCategory[]>} Array of store sub categories
   *
   * @example
   * const storeSubCategories = await getStoreSubCategories(10, 0, Language.ES);
   */
  async getStoreSubCategories(
    limit: number,
    offset: number,
    language?: Language,
  ): Promise<StoreSubCategory[]> {
    const lang = language ?? this.i18nService.getDefaultLanguage();

    this.logger.debug(
      `Fetching store sub categories with limit: ${limit}, offset: ${offset} in language: ${lang}`,
    );

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('Offset must be greater than or equal to 0');
    }

    const storeSubCategories = await this.storeSubCategoryRepository.findAll(
      limit,
      offset,
    );

    this.logger.debug(
      `Fetched ${storeSubCategories.length} store sub categories`,
    );

    return storeSubCategories;
  }
}
