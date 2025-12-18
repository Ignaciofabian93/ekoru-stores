import { ObjectType, Field, ID, Int, Directive } from '@nestjs/graphql';
import { StoreProduct } from './store-product.entity';

@ObjectType()
@Directive('@key(fields: "id")')
export class ProductVariant {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  storeProductId: number;

  @Field()
  name: string;

  @Field(() => Int)
  price: number;

  @Field(() => Int)
  stock: number;

  @Field(() => String, { nullable: true })
  color?: string | null;

  @Field(() => String, { nullable: true })
  size?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => StoreProduct, { nullable: true })
  storeProduct?: StoreProduct;
}
