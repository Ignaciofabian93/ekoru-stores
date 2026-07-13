import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Language } from '../graphql/enums';
import { StoreSubCategoryRepository } from './store-sub-category.repository';
import { I18nStoreSubCategoryService } from './i18n';
import { ProductsService } from '../products/products.service';
import {
  StoreProductFilterInput,
  StoreProductSortInput,
} from '../products/dto/product.input';
import type { StoreSubCategory } from '../types/store-sub-category';

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
 * Store Sub Category Service - Business logic for store sub category operations
 *
 * Lookup conventions:
 * - by slug → web browsing (e.g. /carteras)
 * - by id   → admin panel
 */
@Injectable()
export class StoreSubCategoryService {
  private readonly logger = new Logger(StoreSubCategoryService.name);

  constructor(
    private readonly storeSubCategoryRepository: StoreSubCategoryRepository,
    private readonly i18nService: I18nStoreSubCategoryService,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Gets all store sub categories with page-based pagination
   *
   * @example
   * const subCategories = await getStoreSubCategories({ page: 1, pageSize: 20, language: Language.ES });
   */
  async getStoreSubCategories({
    page = 1,
    pageSize = 20,
    language,
  }: ListParams): Promise<StoreSubCategory[]> {
    const currentPage = page ?? 1;
    const currentPageSize = pageSize ?? 20;

    this.logger.debug(
      `Getting store sub categories: page=${currentPage}, pageSize=${currentPageSize}, language=${language}`,
    );

    this.validatePagination(currentPage, currentPageSize, language);

    const subCategories = await this.storeSubCategoryRepository.findAll(
      currentPage,
      currentPageSize,
    );

    this.logger.debug(`Found ${subCategories.length} store sub categories`);

    return subCategories;
  }

  /**
   * Gets a store sub category by its ID (admin panel)
   *
   * @throws {NotFoundException} If store sub category is not found
   */
  async getStoreSubCategoryById({
    id,
    language,
  }: BaseParams & { id: number }): Promise<StoreSubCategory> {
    this.logger.debug(
      `Getting store sub category by id: ${id}, language: ${language}`,
    );

    const subCategory = await this.storeSubCategoryRepository.findById(id);

    if (!subCategory) {
      throw new NotFoundException(
        this.i18nService.translate(
          'errors.store_sub_category_not_found_id',
          language,
          { id: String(id) },
        ),
      );
    }

    return subCategory;
  }

  /**
   * Gets a store sub category by its slug (web browsing)
   *
   * @throws {NotFoundException} If store sub category is not found
   *
   * @example
   * const subCategory = await getStoreSubCategoryBySlug({ slug: 'carteras', language: Language.ES });
   */
  async getStoreSubCategoryBySlug({
    slug,
    language,
  }: BaseParams & { slug: string }): Promise<StoreSubCategory> {
    this.logger.debug(
      `Getting store sub category by slug: ${slug}, language: ${language}`,
    );

    const subCategory = await this.storeSubCategoryRepository.findBySlug(
      slug,
      language,
    );

    if (!subCategory) {
      throw new NotFoundException(
        this.i18nService.translate(
          'errors.store_sub_category_not_found',
          language,
          { slug },
        ),
      );
    }

    return subCategory;
  }

  /**
   * Gets a store sub category by slug together with its paginated products
   * (web browsing). The sub category's translation is resolved through the
   * StoreSubCategory field resolvers, so clients can select only `products`
   * when paginating.
   */
  async getStoreSubCategoryProductsBySlug({
    slug,
    language,
    page = 1,
    pageSize = 20,
    filter,
    sort,
    excludeSellerId,
  }: ProductQueryParams & { slug: string }) {
    this.logger.debug(
      `Getting store sub category products by slug: ${slug}, page=${page}, pageSize=${pageSize}`,
    );

    const currentPage = page ?? 1;
    const currentPageSize = pageSize ?? 20;

    this.validatePagination(currentPage, currentPageSize, language);

    const storeSubCategory = await this.getStoreSubCategoryBySlug({
      slug,
      language,
    });

    const products = await this.productsService.getProductsBySubCategory({
      subCategoryId: storeSubCategory.id,
      page: currentPage,
      pageSize: currentPageSize,
      filter,
      sort,
      excludeSellerId,
    });

    return {
      storeSubCategory,
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
