import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Language, StoreCategory } from '@prisma/client';
import { StoreCategoryRepository } from '../repositories/store-category.repository';
import { I18nService } from '../common/i18n';

@Injectable()
export class StoreCategoryService {
  private readonly logger = new Logger(StoreCategoryService.name);

  constructor(
    private readonly storeCategoryRepository: StoreCategoryRepository,
    private readonly i18nService: I18nService,
  ) {}

  /**
   * Gets a store category by its slug
   *
   * @param {string} slug - The store category slug
   * @param {Language} language - The language for translation (optional, uses default if not provided)
   * @returns {Promise<StoreCategory>} The store category
   * @throws {NotFoundException} If store category is not found
   *
   * @example
   * const dept = await getStoreCategoryBySlug('tecnologia', Language.ES);
   */
  async getStoreCategoryBySlug(
    slug: string,
    language?: Language,
  ): Promise<StoreCategory> {
    const lang = language ?? this.i18nService.getDefaultLanguage();

    this.logger.debug(
      `Getting store category by slug: ${slug}, language: ${lang}`,
    );

    const storeCategory = await this.storeCategoryRepository.findBySlug(
      slug,
      lang,
    );

    if (!storeCategory) {
      throw new NotFoundException(
        `Store category with slug '${slug}' not found for language '${lang}'`,
      );
    }

    return storeCategory;
  }

  /**
   * Gets all store categories with pagination
   *
   * @param {number} limit - Maximum number of store categories to return (default: 20)
   * @param {number} offset - Number of store categories to skip (default: 0)
   * @param {Language} language - The language for translations (optional, uses default if not provided)
   * @returns {Promise<StoreCategory[]>} Array of store categories
   *
   * @example
   * const storeCategories = await getStoreCategories(10, 0, Language.ES);
   */
  async getStoreCategories(
    limit: number = 20,
    offset: number = 0,
    language?: Language,
  ): Promise<StoreCategory[]> {
    const lang = language ?? this.i18nService.getDefaultLanguage();

    this.logger.debug(
      `Getting store categories with limit: ${limit}, offset: ${offset}, language: ${lang}`,
    );

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('Offset cannot be negative');
    }

    const storeCategories = await this.storeCategoryRepository.findAll(
      limit,
      offset,
    );

    this.logger.debug(`Found ${storeCategories.length} store categories`);

    return storeCategories;
  }

  /**
   * Gets a store category by ID
   *
   * @param {number} id - The store category ID
   * @returns {Promise<StoreCategory>} The store category
   * @throws {NotFoundException} If store category is not found
   */
  async getStoreCategoryById(id: number): Promise<StoreCategory> {
    this.logger.debug(`Getting store category by ID: ${id}`);

    const loader = this.storeCategoryRepository.createStoreCategoryLoader();
    const storeCategory = await loader.load(id);

    if (!storeCategory) {
      throw new NotFoundException(`Store category with ID '${id}' not found`);
    }

    return storeCategory;
  }
}
