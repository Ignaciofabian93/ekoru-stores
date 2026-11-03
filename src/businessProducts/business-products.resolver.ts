import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { CurrentAdmin } from '../common/decorators';
import { Language } from '../graphql/enums';
// The shared bulk-result type from adminCatalog; a second `StoreBulkUpsertResult`
// ObjectType would collide in the federated schema.
import { BulkUpsertResultEntity } from '../adminCatalog/entities';
import { BusinessStoreProductRowInput } from './dto';
import { BusinessProductsService } from './business-products.service';

/** A business's own catalog from the panel's spreadsheet (ADM-16). */
@Resolver()
export class BusinessProductsResolver {
  constructor(private readonly service: BusinessProductsService) {}

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Publishes (rows without id) or updates (rows with id) the signed-in ' +
      "business's own store products, with the web's rules. A business " +
      'account that is the owner or holds MANAGE_BUSINESS_PRODUCTS; at most ' +
      '200 rows per call.',
  })
  publishMyStoreProducts(
    @Args('rows', { type: () => [BusinessStoreProductRowInput] })
    rows: BusinessStoreProductRowInput[],
    @Args('language', { type: () => Language, nullable: true })
    language?: Language,
    @CurrentAdmin() adminId?: string,
  ) {
    return this.service.publishMyStoreProducts({ adminId, rows, language });
  }
}
