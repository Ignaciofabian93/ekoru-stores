import { ObjectType, Field } from '@nestjs/graphql';
import { StoreCategoryEntity } from './store-category.entity';
import { ProductConnectionEntity } from '../../products/entities/product-connection.entity';

/**
 * GraphQL StoreCategoryProducts Entity
 *
 * Combined payload for store category browsing: the store category itself
 * (with its translation and nested sub categories resolved by field resolvers)
 * plus the paginated list of every store product that lives under the category.
 *
 * Returned by getStoreCategoryProductsBySlug (web) and getStoreCategoryProductsById (admin).
 */
@ObjectType('StoreCategoryProducts')
export class StoreCategoryProductsEntity {
  @Field(() => StoreCategoryEntity, {
    description: 'Store category data including translation and sub categories',
  })
  storeCategory: StoreCategoryEntity;

  @Field(() => ProductConnectionEntity, {
    description: 'Paginated store products belonging to the store category',
  })
  products: ProductConnectionEntity;
}
