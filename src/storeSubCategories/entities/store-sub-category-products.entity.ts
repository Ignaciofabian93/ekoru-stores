import { ObjectType, Field } from '@nestjs/graphql';
import { StoreSubCategoryEntity } from './store-sub-category.entity';
import { ProductConnectionEntity } from '../../products/entities/product-connection.entity';

/**
 * GraphQL StoreSubCategoryProducts Entity
 *
 * Combined payload for store sub category browsing: the sub category itself
 * (with its translation resolved by field resolvers) plus the paginated list
 * of its store products.
 *
 * Clients select the full payload on the first load and only the `products`
 * field when paginating, so the sub category data is not re-resolved on page changes.
 *
 * Returned by getStoreSubCategoryProductsBySlug.
 */
@ObjectType('StoreSubCategoryProducts')
export class StoreSubCategoryProductsEntity {
  @Field(() => StoreSubCategoryEntity, {
    description: 'Store sub category data including translation',
  })
  storeSubCategory: StoreSubCategoryEntity;

  @Field(() => ProductConnectionEntity, {
    description: 'Paginated store products belonging to the sub category',
  })
  products: ProductConnectionEntity;
}
