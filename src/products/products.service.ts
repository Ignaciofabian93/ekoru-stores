import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { I18nService } from '../common/i18n';
import {
  StoreProductFilterInput,
  StoreProductSortInput,
  AddStoreProductInput,
  UpdateStoreProductInput,
} from './dto/product.input';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18nService: I18nService,
  ) {}

  /**
   * Get a single store product by ID
   */
  async getProductById(id: number) {
    const product = await this.prisma.storeProduct.findUnique({
      where: { id },
      include: {
        storeSubCategory: true,
      },
    });

    if (!product) {
      throw new NotFoundException(
        this.i18nService.translate(
          'errors.store_product_not_found',
          this.i18nService.getDefaultLanguage(),
          { id: String(id) },
        ),
      );
    }

    return product;
  }

  /**
   * Get all store products with pagination and filters
   */
  async getProducts({
    page,
    pageSize,
    filter,
    sort,
    excludeSellerId,
  }: {
    page: number;
    pageSize: number;
    filter?: StoreProductFilterInput;
    sort?: StoreProductSortInput;
    excludeSellerId?: string;
  }) {
    const skip = (page - 1) * pageSize;
    const where = this.buildWhereClause(filter, excludeSellerId);
    const orderBy = this.buildOrderBy(sort);

    const [products, totalCount] = await Promise.all([
      this.prisma.storeProduct.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          storeSubCategory: true,
          materialCompositions: true,
        },
      }),
      this.prisma.storeProduct.count({ where }),
    ]);

    return this.createPaginatedResponse(products, totalCount, page, pageSize);
  }

  /**
   * Get store products by seller ID
   */
  async getProductsBySeller({
    sellerId,
    page,
    pageSize,
    filter,
    sort,
  }: {
    sellerId: string;
    page: number;
    pageSize: number;
    filter?: StoreProductFilterInput;
    sort?: StoreProductSortInput;
  }) {
    const skip = (page - 1) * pageSize;
    const where = {
      ...this.buildWhereClause(filter),
      sellerId,
    };
    const orderBy = this.buildOrderBy(sort);

    const [products, totalCount] = await Promise.all([
      this.prisma.storeProduct.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          storeSubCategory: true,
        },
      }),
      this.prisma.storeProduct.count({ where }),
    ]);

    return this.createPaginatedResponse(products, totalCount, page, pageSize);
  }

  /**
   * Get store products by Store SubCategory ID
   * Returns only products in this specific subcategory
   */
  async getProductsBySubCategory({
    subCategoryId,
    page,
    pageSize,
    filter,
    sort,
    excludeSellerId,
  }: {
    subCategoryId: number;
    page: number;
    pageSize: number;
    filter?: StoreProductFilterInput;
    sort?: StoreProductSortInput;
    excludeSellerId?: string;
  }) {
    const skip = (page - 1) * pageSize;
    const where = {
      ...this.buildWhereClause(filter, excludeSellerId),
      subCategoryId,
    };
    const orderBy = this.buildOrderBy(sort);

    const [products, totalCount] = await Promise.all([
      this.prisma.storeProduct.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          storeSubCategory: true,
        },
      }),
      this.prisma.storeProduct.count({ where }),
    ]);

    return this.createPaginatedResponse(products, totalCount, page, pageSize);
  }

  /**
   * Get store products by Store Category ID
   * Returns all products from all subcategories under this category
   */
  async getProductsByStoreCategory({
    categoryId,
    page,
    pageSize,
    filter,
    sort,
    excludeSellerId,
  }: {
    categoryId: number;
    page: number;
    pageSize: number;
    filter?: StoreProductFilterInput;
    sort?: StoreProductSortInput;
    excludeSellerId?: string;
  }) {
    // First, get all subcategory IDs under this store category
    const subCategories = await this.prisma.storeSubCategory.findMany({
      where: {
        storeCategoryId: categoryId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    const subCategoryIds = subCategories.map((sc) => sc.id);

    if (subCategoryIds.length === 0) {
      return this.createPaginatedResponse([], 0, page, pageSize);
    }

    const skip = (page - 1) * pageSize;
    const where = {
      ...this.buildWhereClause(filter, excludeSellerId),
      subCategoryId: {
        in: subCategoryIds,
      },
    };
    const orderBy = this.buildOrderBy(sort);

    const [products, totalCount] = await Promise.all([
      this.prisma.storeProduct.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          storeSubCategory: true,
        },
      }),
      this.prisma.storeProduct.count({ where }),
    ]);

    return this.createPaginatedResponse(products, totalCount, page, pageSize);
  }

  /**
   * Get products on offer/sale
   */
  async getProductsOnOffer({
    page,
    pageSize,
    filter,
    sort,
    excludeSellerId,
  }: {
    page: number;
    pageSize: number;
    filter?: StoreProductFilterInput;
    sort?: StoreProductSortInput;
    excludeSellerId?: string;
  }) {
    const skip = (page - 1) * pageSize;
    const where = {
      ...this.buildWhereClause(filter, excludeSellerId),
      hasOffer: true,
    };
    const orderBy = this.buildOrderBy(sort);

    const [products, totalCount] = await Promise.all([
      this.prisma.storeProduct.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          storeSubCategory: true,
        },
      }),
      this.prisma.storeProduct.count({ where }),
    ]);

    return this.createPaginatedResponse(products, totalCount, page, pageSize);
  }

  /**
   * Add a new product
   */
  async addProduct({
    input,
    sellerId,
  }: {
    input: AddStoreProductInput;
    sellerId?: string;
  }) {
    if (!sellerId) {
      throw new UnauthorizedException(
        this.i18nService.translate(
          'errors.seller_auth_required',
          this.i18nService.getDefaultLanguage(),
        ),
      );
    }

    // `materials` is a nested relation, not a scalar column, so it must be
    // pulled out of the spread and turned into a nested create.
    const { materials, ...rest } = input;

    const product = await this.prisma.storeProduct.create({
      data: {
        ...rest,
        sellerId,
        updatedAt: new Date(),
        ...(materials?.length && {
          materialCompositions: {
            create: materials.map((material) => ({
              materialTypeId: material.materialTypeId,
              percentage: material.percentage,
            })),
          },
        }),
      },
      include: {
        storeSubCategory: true,
      },
    });

    return product;
  }

  /**
   * Update an existing product
   */
  async updateProduct({
    input,
    sellerId,
    adminId,
  }: {
    input: UpdateStoreProductInput;
    sellerId?: string;
    adminId?: string;
  }) {
    const lang = this.i18nService.getDefaultLanguage();

    if (!sellerId && !adminId) {
      throw new UnauthorizedException(
        this.i18nService.translate('errors.seller_auth_required', lang),
      );
    }

    const product = await this.prisma.storeProduct.findUnique({
      where: { id: input.id },
    });

    if (!product) {
      throw new NotFoundException(
        this.i18nService.translate('errors.store_product_not_found', lang, {
          id: String(input.id),
        }),
      );
    }

    if (!adminId && product.sellerId !== sellerId) {
      throw new ForbiddenException(
        this.i18nService.translate('errors.product_update_forbidden', lang),
      );
    }

    // Pull `materials` out of the spread. When present (even as an empty array)
    // it fully replaces the existing composition; when omitted it is left as-is.
    const { id, materials, ...data } = input;
    const updatedProduct = await this.prisma.storeProduct.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
        ...(materials && {
          materialCompositions: {
            deleteMany: {},
            create: materials.map((material) => ({
              materialTypeId: material.materialTypeId,
              percentage: material.percentage,
            })),
          },
        }),
      },
      include: {
        storeSubCategory: true,
      },
    });

    return updatedProduct;
  }

  /**
   * Delete a store product (soft delete)
   */
  async deleteProduct({
    id,
    sellerId,
    adminId,
  }: {
    id: number;
    sellerId?: string;
    adminId?: string;
  }) {
    const lang = this.i18nService.getDefaultLanguage();

    if (!sellerId && !adminId) {
      throw new UnauthorizedException(
        this.i18nService.translate('errors.seller_auth_required', lang),
      );
    }

    const product = await this.prisma.storeProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(
        this.i18nService.translate('errors.store_product_not_found', lang, {
          id: String(id),
        }),
      );
    }

    if (!adminId && product.sellerId !== sellerId) {
      throw new ForbiddenException(
        this.i18nService.translate('errors.product_delete_forbidden', lang),
      );
    }

    const deletedProduct = await this.prisma.storeProduct.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
      include: {
        storeSubCategory: true,
      },
    });

    return deletedProduct;
  }

  /**
   * Toggle store product active status
   */
  async toggleProductActive({
    id,
    sellerId,
    adminId,
  }: {
    id: number;
    sellerId?: string;
    adminId?: string;
  }) {
    const lang = this.i18nService.getDefaultLanguage();

    if (!sellerId && !adminId) {
      throw new UnauthorizedException(
        this.i18nService.translate('errors.seller_auth_required', lang),
      );
    }

    const product = await this.prisma.storeProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(
        this.i18nService.translate('errors.store_product_not_found', lang, {
          id: String(id),
        }),
      );
    }

    if (!adminId && product.sellerId !== sellerId) {
      throw new ForbiddenException(
        this.i18nService.translate('errors.product_modify_forbidden', lang),
      );
    }

    const updatedProduct = await this.prisma.storeProduct.update({
      where: { id },
      data: {
        isActive: !product.isActive,
        updatedAt: new Date(),
      },
      include: {
        storeSubCategory: true,
      },
    });

    return updatedProduct;
  }

  /**
   * Toggle the current seller's favorite mark on a store product. Idempotent
   * per (product, seller). Returns the product so `isLiked` re-resolves.
   */
  async toggleProductLike({
    storeProductId,
    sellerId,
  }: {
    storeProductId: number;
    sellerId?: string;
  }) {
    const lang = this.i18nService.getDefaultLanguage();

    if (!sellerId) {
      throw new UnauthorizedException(
        this.i18nService.translate('errors.seller_auth_required', lang),
      );
    }

    const product = await this.prisma.storeProduct.findUnique({
      where: { id: storeProductId },
      include: { storeSubCategory: true },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException(
        this.i18nService.translate('errors.store_product_not_found', lang, {
          id: String(storeProductId),
        }),
      );
    }

    const existing = await this.prisma.storeProductLike.findUnique({
      where: { storeProductId_sellerId: { storeProductId, sellerId } },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.storeProductLike.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.storeProductLike.create({
        data: { storeProductId, sellerId },
      });
    }

    return product;
  }

  /**
   * Paginated list of the current seller's favorite store products. Inactive or
   * soft-deleted products are excluded so unavailable favorites drop off.
   */
  async getMyFavorites({
    sellerId,
    page,
    pageSize,
  }: {
    sellerId?: string;
    page: number;
    pageSize: number;
  }) {
    const lang = this.i18nService.getDefaultLanguage();

    if (!sellerId) {
      throw new UnauthorizedException(
        this.i18nService.translate('errors.seller_auth_required', lang),
      );
    }

    const skip = (page - 1) * pageSize;
    const where = {
      sellerId,
      storeProduct: { isActive: true, deletedAt: null },
    };

    const [likes, totalCount] = await Promise.all([
      this.prisma.storeProductLike.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { storeProduct: { include: { storeSubCategory: true } } },
      }),
      this.prisma.storeProductLike.count({ where }),
    ]);

    const products = likes.map((like) => like.storeProduct);
    return this.createPaginatedResponse(products, totalCount, page, pageSize);
  }

  /**
   * Build Prisma orderBy clause from sort input
   */
  private buildOrderBy(
    sort?: StoreProductSortInput,
  ): Prisma.StoreProductOrderByWithRelationInput {
    if (!sort || !sort.field) {
      return { createdAt: 'desc' };
    }

    const field = sort.field.toLowerCase();
    const order = sort.order?.toLowerCase() || 'desc';

    return { [field]: order } as Prisma.StoreProductOrderByWithRelationInput;
  }

  /**
   * Create paginated response
   */
  private createPaginatedResponse<T>(
    items: T[],
    totalCount: number,
    page: number,
    pageSize: number,
  ) {
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      nodes: items,
      pageInfo: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        pageSize,
        startCursor: null,
        endCursor: null,
      },
    };
  }
  /**
   * Build Prisma where clause from filter input.
   *
   * When `excludeSellerId` is provided (the authenticated caller), that seller's
   * own store products are hidden from browsing/search results — they remain
   * visible to the seller in their profile via getProductsBySeller.
   */
  private buildWhereClause(
    filter?: StoreProductFilterInput,
    excludeSellerId?: string,
  ): Prisma.StoreProductWhereInput {
    const where: Prisma.StoreProductWhereInput = {
      isActive: true,
      deletedAt: null,
    };

    if (excludeSellerId) {
      where.sellerId = { not: excludeSellerId };
    }

    if (!filter) {
      return where;
    }

    if (filter.name) {
      where.name = {
        contains: filter.name,
        mode: 'insensitive',
      };
    }

    if (filter.minPrice !== undefined) {
      where.price = { gte: filter.minPrice };
    }

    if (filter.maxPrice !== undefined) {
      where.price = { lte: filter.maxPrice };
    }

    if (filter.brand) {
      where.brand = {
        contains: filter.brand,
        mode: 'insensitive',
      };
    }

    if (filter.color) {
      where.color = {
        contains: filter.color,
        mode: 'insensitive',
      };
    }

    if (filter.badges && filter.badges.length > 0) {
      where.badges = {
        hasSome: filter.badges,
      };
    }

    if (filter.hasOffer !== undefined) {
      where.hasOffer = filter.hasOffer;
    }

    if (filter.isLowStock !== undefined) {
      where.isLowStock = filter.isLowStock;
    }

    if (filter.subCategoryId !== undefined) {
      where.subCategoryId = filter.subCategoryId;
    }

    if (filter.tags && filter.tags.length > 0) {
      where.tags = {
        hasSome: filter.tags,
      };
    }

    if (filter.minRating !== undefined) {
      where.averageRating = {
        gte: filter.minRating,
      };
    }

    return where;
  }
}
