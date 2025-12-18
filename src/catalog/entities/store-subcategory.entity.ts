import { ObjectType, Field, ID, Int, Directive } from '@nestjs/graphql';
import { StoreCategory } from './store-category.entity';
import { StoreProductConnection } from './store-product-connection.entity';
import { StoreProductMaterial } from './store-product-material.entity';

@ObjectType()
@Directive('@key(fields: "id")')
export class StoreSubCategory {
  @Field(() => ID)
  id: number;

  @Field(() => Int, { nullable: true })
  storeCategoryId?: number | null;

  @Field()
  subCategory: string;

  @Field(() => String, { nullable: true })
  href?: string | null;

  @Field(() => StoreCategory, { nullable: true })
  storeCategory?: StoreCategory;

  @Field(() => StoreProductConnection, { nullable: true })
  products?: StoreProductConnection;

  @Field(() => Int, { nullable: true })
  productCount?: number;

  @Field(() => [StoreProductMaterial], { nullable: true })
  materials?: StoreProductMaterial[];
}
