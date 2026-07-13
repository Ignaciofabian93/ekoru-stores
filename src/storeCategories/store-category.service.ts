import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Language } from '../graphql/enums';
import { StoreCategoryRepository } from './store-category.repository';
import { I18nStoreCategoryService } from './i18n';
import { ProductsService } from '../products/products.service';
import {
  StoreProductFilterInput,
  StoreProductSortInput,
} from '../products/dto/product.input';
import type { StoreCategory } from '../types/store-category';

type BaseParams = {
  language: Language;
};

type ListParams = BaseParams & {
  page?: number | null;
  pageSize?: number | null;
};

type ProductQueryParams = ListParams & {
  filter?: StoreProductFilterInput;
  sort?: StoreProductSortInput;
  excludeSellerId?: string;
};

/**
 * Store Category Service - Business logic for store category operations
 *
 * This service provides high-level operations for store categories, coordinating
 * between repositories and applying business rules.
 *
 * Lookup conventions:
 * - by slug → web browsing (e.g. /moda)
 * - by id   → admin panel
 */
@Injectable()
export class StoreCategoryService {
  private readonly logger = new Logger(StoreCategoryService.name);

  constructor(
    private readonly storeCategoryRepository: StoreCategoryRepository,
    private readonly i18nService: I18nStoreCategoryService,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Gets all store categories with page-based pagination
   *
   * @example
   * const storeCategories = await getStoreCategories({ page: 1, pageSize: 20, language: Language.ES });
   */
  async getStoreCategories({
    page = 1,
    pageSize = 20,
    language,
  }: ListParams): Promise<StoreCategory[]> {
    const currentPage = page ?? 1;
    const currentPageSize = pageSize ?? 20;

    this.logger.debug(
      `Getting store categories: page=${currentPage}, pageSize=${currentPageSize}, language=${language}`,
    );

    this.validatePagination(currentPage, currentPageSize, language);

    const storeCategories = await this.storeCategoryRepository.findAll(
      currentPage,
      currentPageSize,
    );

    this.logger.debug(`Found ${storeCategories.length} store categories`);

    return storeCategories;
  }

  /**
   * Gets a store category by its ID (admin panel)
   *
   * @throws {NotFoundException} If store category is not found
   */
  async getStoreCategoryById({
    id,
    language,
  }: BaseParams & { id: number }): Promise<StoreCategory> {
    this.logger.debug(
      `Getting store category by id: ${id}, language: ${language}`,
    );

    const storeCategory = await this.storeCategoryRepository.findById(id);

    if (!storeCategory) {
      throw new NotFoundException(
        this.i18nService.translate(
          'errors.store_category_not_found_id',
          language,
          { id: String(id) },
        ),
      );
    }

    return storeCategory;
  }

  /**
   * Gets a store category by its slug (web browsing)
   *
   * @throws {NotFoundException} If store category is not found
   *
   * @example
   * const storeCategory = await getStoreCategoryBySlug({ slug: 'moda', language: Language.ES });
   */
  async getStoreCategoryBySlug({
    slug,
    language,
  }: BaseParams & { slug: string }): Promise<StoreCategory> {
    this.logger.debug(
      `Getting store category by slug: ${slug}, language: ${language}`,
    );

    const storeCategory = await this.storeCategoryRepository.findBySlug(
      slug,
      language,
    );

    if (!storeCategory) {
      throw new NotFoundException(
        this.i18nService.translate(
          'errors.store_category_not_found',
          language,
          { slug },
        ),
      );
    }

    return storeCategory;
  }

  /**
   * Gets a store category by ID together with the paginated list of every
   * product under it (admin panel). Sub categories are resolved through the
   * StoreCategory field resolvers.
   */
  async getStoreCategoryProductsById({
    id,
    language,
    page = 1,
    pageSize = 20,
    filter,
    sort,
    excludeSellerId,
  }: ProductQueryParams & { id: number }) {
    this.logger.debug(
      `Getting store category products by id: ${id}, page=${page}, pageSize=${pageSize}`,
    );

    const storeCategory = await this.getStoreCategoryById({ id, language });

    return this.buildStoreCategoryProducts(storeCategory, {
      language,
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId,
    });
  }

  /**
   * Gets a store category by slug together with the paginated list of every
   * product under it (web browsing). Sub categories are resolved through the
   * StoreCategory field resolvers.
   *
   * @example
   * const { storeCategory, products } = await getStoreCategoryProductsBySlug({
   *   slug: 'moda',
   *   language: Language.ES,
   *   page: 1,
   *   pageSize: 20,
   * });
   */
  async getStoreCategoryProductsBySlug({
    slug,
    language,
    page = 1,
    pageSize = 20,
    filter,
    sort,
    excludeSellerId,
  }: ProductQueryParams & { slug: string }) {
    this.logger.debug(
      `Getting store category products by slug: ${slug}, page=${page}, pageSize=${pageSize}`,
    );

    const storeCategory = await this.getStoreCategoryBySlug({ slug, language });

    return this.buildStoreCategoryProducts(storeCategory, {
      language,
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId,
    });
  }

  /**
   * Fetches the paginated products of an already-resolved store category and
   * returns the combined StoreCategoryProducts payload.
   */
  private async buildStoreCategoryProducts(
    storeCategory: StoreCategory,
    {
      language,
      page = 1,
      pageSize = 20,
      filter,
      sort,
      excludeSellerId,
    }: ProductQueryParams,
  ) {
    const currentPage = page ?? 1;
    const currentPageSize = pageSize ?? 20;

    this.validatePagination(currentPage, currentPageSize, language);

    const products = await this.productsService.getProductsByStoreCategory({
      categoryId: storeCategory.id,
      page: currentPage,
      pageSize: currentPageSize,
      filter,
      sort,
      excludeSellerId,
    });

    return {
      storeCategory,
      products,
    };
  }

  /**
   * Validates page-based pagination parameters (page >= 1, 1 <= pageSize <= 100)
   */
  private validatePagination(
    page: number,
    pageSize: number,
    language: Language,
  ): void {
    if (page < 1) {
      throw new BadRequestException(
        this.i18nService.translate('errors.invalid_page', language),
      );
    }

    if (pageSize < 1 || pageSize > 100) {
      throw new BadRequestException(
        this.i18nService.translate('errors.page_size_out_of_range', language, {
          min: '1',
          max: '100',
        }),
      );
    }
  }
}
