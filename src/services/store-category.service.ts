import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { StoreCategory } from '@prisma/client';
import { StoreCategoryRepository } from '../repositories/store-category.repository';
import { I18nService } from '../common/i18n';
import { Language } from '../graphql/enums';

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
  async getStoreCategoryBySlug({
    slug,
    language,
  }: {
    slug: string;
    language?: Language;
  }): Promise<StoreCategory> {
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
        this.i18nService.translate('errors.store_category_not_found', lang, {
          slug,
        }),
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
  async getStoreCategories({
    limit = 20,
    offset = 0,
    language,
  }: {
    limit?: number;
    offset?: number;
    language?: Language;
  }): Promise<StoreCategory[]> {
    const lang = language ?? this.i18nService.getDefaultLanguage();

    this.logger.debug(
      `Getting store categories with limit: ${limit}, offset: ${offset}, language: ${lang}`,
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
      throw new NotFoundException(
        this.i18nService.translate(
          'errors.store_category_id_not_found',
          this.i18nService.getDefaultLanguage(),
          { id: String(id) },
        ),
      );
    }

    return storeCategory;
  }
}
