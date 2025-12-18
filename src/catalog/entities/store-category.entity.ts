import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';
import { StoreSubCategory } from './store-subcategory.entity';
import { StoreProductConnection } from './store-product-connection.entity';

@ObjectType()
@Directive('@key(fields: "id")')
export class StoreCategory {
  @Field(() => ID)
  id: number;

  @Field()
  category: string;

  @Field(() => String, { nullable: true })
  href?: string | null;

  @Field(() => [StoreSubCategory])
  subcategories: StoreSubCategory[];

  @Field(() => StoreProductConnection, { nullable: true })
  products?: StoreProductConnection;
}
