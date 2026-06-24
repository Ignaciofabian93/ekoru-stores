import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Language } from '../graphql/enums';
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
  async getStoreSubCategoryBySlug({
    slug,
    language,
  }: {
    slug: string;
    language?: Language;
  }): Promise<StoreSubCategory> {
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
        this.i18nService.translate('errors.store_subcategory_not_found', lang, {
          slug,
        }),
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
  async getStoreSubCategories({
    limit,
    offset,
    language,
  }: {
    limit: number;
    offset: number;
    language?: Language;
  }): Promise<StoreSubCategory[]> {
    const lang = language ?? this.i18nService.getDefaultLanguage();

    this.logger.debug(
      `Fetching store sub categories with limit: ${limit}, offset: ${offset} in language: ${lang}`,
    );

    if (limit < 1 || limit > 100) {
      throw new Error(
        this.i18nService.translate('errors.limit_out_of_range', lang, {
          min: '1',
          max: '100',
        }),
      );
    }

    if (offset < 0) {
      throw new Error(
        this.i18nService.translate('errors.offset_negative', lang),
      );
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
