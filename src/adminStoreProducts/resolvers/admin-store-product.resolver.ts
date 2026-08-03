import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { CurrentAdmin } from '../../common/decorators';
// Reuse the shared bulk-result type from adminCatalog — redefining the
// `StoreBulkUpsertResult` ObjectType would collide in the federated schema.
import { BulkUpsertResultEntity } from '../../adminCatalog/entities';
import { RawStoreProductConnectionEntity } from '../entities';
import {
  RawStoreProductListArgs,
  StoreProductUpsertRowInput,
  StoreProductMaterialUpsertRowInput,
  ProductVariantUpsertRowInput,
} from '../dto';
import { AdminStoreProductService } from '../admin-store-product.service';

/**
 * Admin Store Product GraphQL Resolver
 *
 * Platform-admin surface over StoreProduct. Every operation requires the
 * x-admin-id header set by the gateway. `rawStoreProducts` returns the whole
 * catalog (inactive / soft-deleted included); the bulk upsert is shared by the
 * XLSX import and the row-by-row edit form, plus a hard delete.
 */
@Resolver()
export class AdminStoreProductResolver {
  private readonly logger = new Logger(AdminStoreProductResolver.name);

  constructor(
    private readonly adminStoreProductService: AdminStoreProductService,
  ) {}

  @Query(() => RawStoreProductConnectionEntity, {
    name: 'rawStoreProducts',
    description:
      'Paginated store products exactly as stored, inactive and soft-deleted ' +
      'included. Optional subCategoryId / sellerId / deleted filters. Admins only.',
  })
  async getRawStoreProducts(
    @Args()
    {
      id,
      page,
      pageSize,
      search,
      subCategoryId,
      sellerId,
      deleted,
    }: RawStoreProductListArgs,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Query: rawStoreProducts(page: ${page})`);
    return this.adminStoreProductService.getRawStoreProducts({
      adminId,
      id,
      page,
      pageSize,
      search,
      subCategoryId,
      sellerId,
      deleted,
    });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates (rows without id) or updates (rows with id) store products. ' +
      'Setting subCategoryId re-parents a product. Admins only.',
  })
  async bulkUpsertStoreProducts(
    @Args('rows', { type: () => [StoreProductUpsertRowInput] })
    rows: StoreProductUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: bulkUpsertStoreProducts(${rows.length} rows)`);
    return this.adminStoreProductService.bulkUpsertStoreProducts({
      adminId,
      rows,
    });
  }

  @Mutation(() => Boolean, {
    description:
      'Hard-deletes a store product. Fails while order items or other rows ' +
      'reference it. Admins only.',
  })
  async deleteStoreProduct(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteStoreProduct(${id})`);
    return this.adminStoreProductService.deleteStoreProduct({ adminId, id });
  }

  // ─── Material composition ─────────────────────────────────────────────────────

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Bulk create/update store product material links. Rows without id are ' +
      'matched by (storeProductId, materialTypeId). Admins only.',
  })
  async bulkUpsertStoreProductMaterials(
    @Args('rows', { type: () => [StoreProductMaterialUpsertRowInput] })
    rows: StoreProductMaterialUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertStoreProductMaterials(${rows.length} rows)`,
    );
    return this.adminStoreProductService.bulkUpsertStoreProductMaterials({
      adminId,
      rows,
    });
  }

  @Mutation(() => Boolean, {
    description: 'Hard-deletes a store product material link. Admins only.',
  })
  async deleteStoreProductMaterial(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteStoreProductMaterial(${id})`);
    return this.adminStoreProductService.deleteStoreProductMaterial({
      adminId,
      id,
    });
  }

  // ─── Variants ─────────────────────────────────────────────────────────────────

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Bulk create/update store product variants (rows with id update, without ' +
      'id create). Admins only.',
  })
  async bulkUpsertProductVariants(
    @Args('rows', { type: () => [ProductVariantUpsertRowInput] })
    rows: ProductVariantUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertProductVariants(${rows.length} rows)`,
    );
    return this.adminStoreProductService.bulkUpsertProductVariants({
      adminId,
      rows,
    });
  }

  @Mutation(() => Boolean, {
    description: 'Hard-deletes a store product variant. Admins only.',
  })
  async deleteProductVariant(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteProductVariant(${id})`);
    return this.adminStoreProductService.deleteProductVariant({ adminId, id });
  }
}
