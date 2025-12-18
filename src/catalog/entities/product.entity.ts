import { ObjectType, Field, ID, Int, Directive } from '@nestjs/graphql';
import { Badge, ProductCondition } from '../../graphql/enums';
import { ProductCategory } from './product-category.entity';
import { EnvironmentalImpact } from './environmental-impact.entity';

// Federated Seller type - external reference
@ObjectType()
@Directive('@key(fields: "id")')
@Directive('@extends')
export class Seller {
  @Field(() => ID)
  @Directive('@external')
  id: string;
}

@ObjectType()
@Directive('@key(fields: "id")')
export class Product {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Int)
  price: number;

  @Field()
  hasOffer: boolean;

  @Field(() => Int)
  offerPrice: number;

  @Field()
  sellerId: string;

  @Field(() => [Badge])
  badges: Badge[];

  @Field()
  brand: string;

  @Field(() => String, { nullable: true })
  color?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => [String])
  images: string[];

  @Field(() => [String])
  interests: string[];

  @Field()
  isActive: boolean;

  @Field()
  isExchangeable: boolean;

  @Field(() => Int)
  productCategoryId: number;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => ProductCondition)
  condition: ProductCondition;

  @Field(() => String, { nullable: true })
  conditionDescription?: string | null;

  @Field(() => ProductCategory, { nullable: true })
  productCategory?: ProductCategory;

  @Field(() => Seller, { nullable: true })
  seller?: Seller;

  @Field(() => EnvironmentalImpact, { nullable: true })
  environmentalImpact?: EnvironmentalImpact;
}
