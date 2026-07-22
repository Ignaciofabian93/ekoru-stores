import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { CurrentAdmin } from '../../common/decorators';
// Reuse the shared bulk-result type from adminCatalog — redefining the
// `StoreBulkUpsertResult` ObjectType would collide in the federated schema.
import { BulkUpsertResultEntity } from '../../adminCatalog/entities';
import { RawStoreProductConnectionEntity } from '../entities';
import { RawStoreProductListArgs, StoreProductUpsertRowInput } from '../dto';
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
}
