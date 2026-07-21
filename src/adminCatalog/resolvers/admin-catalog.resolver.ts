import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { CurrentAdmin } from '../../common/decorators';
import {
  RawStoreCategoryConnectionEntity,
  RawStoreSubCategoryConnectionEntity,
  BulkUpsertResultEntity,
} from '../entities';
import {
  RawStoreCatalogListArgs,
  RawStoreSubCategoriesArgs,
  StoreCategoryUpsertRowInput,
  StoreCategoryTranslationUpsertRowInput,
  StoreSubCategoryUpsertRowInput,
  StoreSubCategoryTranslationUpsertRowInput,
} from '../dto';
import { AdminCatalogService } from '../admin-catalog.service';

/**
 * Admin Store Catalog GraphQL Resolver
 *
 * Platform-admin surface over the store catalog tables. Every operation
 * requires the x-admin-id header set by the gateway; anonymous or seller
 * traffic is rejected by the service.
 *
 * Reads (`rawStore*`) return rows exactly as stored so the admin panel can
 * list, edit and export them. Writes are bulk upserts shared by the XLSX
 * import and the row-by-row edit forms (a single-row array), plus per-row
 * deletes.
 */
@Resolver()
export class AdminCatalogResolver {
  private readonly logger = new Logger(AdminCatalogResolver.name);

  constructor(private readonly adminCatalogService: AdminCatalogService) {}

  // ─── Raw reads ──────────────────────────────────────────────────────────────

  @Query(() => RawStoreCategoryConnectionEntity, {
    name: 'rawStoreCategories',
    description:
      'Paginated, unprocessed store categories with every translation. Admins only.',
  })
  async getRawStoreCategories(
    @Args() { id, page, pageSize, search }: RawStoreCatalogListArgs,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Query: rawStoreCategories(page: ${page})`);
    return this.adminCatalogService.getRawStoreCategories({
      adminId,
      id,
      page,
      pageSize,
      search,
    });
  }

  @Query(() => RawStoreSubCategoryConnectionEntity, {
    name: 'rawStoreSubCategories',
    description:
      'Paginated, unprocessed store sub categories with every translation. ' +
      'Optionally filtered by storeCategoryId. Admins only.',
  })
  async getRawStoreSubCategories(
    @Args()
    { id, page, pageSize, search, storeCategoryId }: RawStoreSubCategoriesArgs,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Query: rawStoreSubCategories(page: ${page})`);
    return this.adminCatalogService.getRawStoreSubCategories({
      adminId,
      id,
      page,
      pageSize,
      search,
      storeCategoryId,
    });
  }

  // ─── Bulk upserts ───────────────────────────────────────────────────────────

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates (rows without id) or updates (rows with id) store categories. Admins only.',
  })
  async bulkUpsertStoreCategories(
    @Args('rows', { type: () => [StoreCategoryUpsertRowInput] })
    rows: StoreCategoryUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertStoreCategories(${rows.length} rows)`,
    );
    return this.adminCatalogService.bulkUpsertStoreCategories({
      adminId,
      rows,
    });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates or updates store category translations. Rows without id are ' +
      'matched by (storeCategoryId, language). Admins only.',
  })
  async bulkUpsertStoreCategoryTranslations(
    @Args('rows', { type: () => [StoreCategoryTranslationUpsertRowInput] })
    rows: StoreCategoryTranslationUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertStoreCategoryTranslations(${rows.length} rows)`,
    );
    return this.adminCatalogService.bulkUpsertStoreCategoryTranslations({
      adminId,
      rows,
    });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates (rows without id) or updates (rows with id) store sub categories. ' +
      'Setting storeCategoryId re-parents a sub category. Admins only.',
  })
  async bulkUpsertStoreSubCategories(
    @Args('rows', { type: () => [StoreSubCategoryUpsertRowInput] })
    rows: StoreSubCategoryUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertStoreSubCategories(${rows.length} rows)`,
    );
    return this.adminCatalogService.bulkUpsertStoreSubCategories({
      adminId,
      rows,
    });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates or updates store sub category translations. Rows without id are ' +
      'matched by (storeSubCategoryId, language). Admins only.',
  })
  async bulkUpsertStoreSubCategoryTranslations(
    @Args('rows', { type: () => [StoreSubCategoryTranslationUpsertRowInput] })
    rows: StoreSubCategoryTranslationUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertStoreSubCategoryTranslations(${rows.length} rows)`,
    );
    return this.adminCatalogService.bulkUpsertStoreSubCategoryTranslations({
      adminId,
      rows,
    });
  }

  // ─── Deletes ────────────────────────────────────────────────────────────────

  @Mutation(() => Boolean, {
    description:
      'Deletes a store category (translations cascade; fails while sub categories ' +
      'still have products). Admins only.',
  })
  async deleteStoreCategory(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteStoreCategory(${id})`);
    return this.adminCatalogService.deleteStoreCategory({ adminId, id });
  }

  @Mutation(() => Boolean, {
    description:
      'Deletes a single store category translation row. Admins only.',
  })
  async deleteStoreCategoryTranslation(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteStoreCategoryTranslation(${id})`);
    return this.adminCatalogService.deleteStoreCategoryTranslation({
      adminId,
      id,
    });
  }

  @Mutation(() => Boolean, {
    description:
      'Deletes a store sub category (translations cascade; fails while store ' +
      'products reference it). Admins only.',
  })
  async deleteStoreSubCategory(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteStoreSubCategory(${id})`);
    return this.adminCatalogService.deleteStoreSubCategory({ adminId, id });
  }

  @Mutation(() => Boolean, {
    description:
      'Deletes a single store sub category translation row. Admins only.',
  })
  async deleteStoreSubCategoryTranslation(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteStoreSubCategoryTranslation(${id})`);
    return this.adminCatalogService.deleteStoreSubCategoryTranslation({
      adminId,
      id,
    });
  }
}
