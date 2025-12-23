import { ObjectType, Field, ID, Int, Float, Directive } from '@nestjs/graphql';
import { Badge } from '../../graphql/enums';
import { StoreSubCategory } from './store-subcategory.entity';
import { ProductVariant } from './product-variant.entity';

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
export class StoreProduct {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Int)
  stock: number;

  @Field(() => String, { nullable: true })
  barcode?: string | null;

  @Field(() => String, { nullable: true })
  sku?: string | null;

  @Field(() => Int)
  price: number;

  @Field()
  hasOffer: boolean;

  @Field(() => Int)
  offerPrice: number;

  @Field()
  sellerId: string;

  @Field(() => [String])
  images: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field()
  isActive: boolean;

  @Field(() => [Badge])
  badges: Badge[];

  @Field()
  brand: string;

  @Field(() => String, { nullable: true })
  color?: string | null;

  @Field(() => Int)
  ratingCount: number;

  @Field(() => Float)
  ratings: number;

  @Field(() => Int)
  reviewsNumber: number;

  @Field(() => String, { nullable: true })
  materialComposition?: string | null;

  @Field(() => Float, { nullable: true })
  recycledContent?: number | null;

  @Field(() => Int)
  subcategoryId: number;

  @Field(() => Int, { nullable: true })
  sustainabilityScore?: number | null;

  @Field(() => Float, { nullable: true })
  carbonFootprint?: number | null;

  @Field(() => [ProductVariant])
  productVariants: ProductVariant[];

  @Field(() => StoreSubCategory, { nullable: true })
  storeSubCategory?: StoreSubCategory;

  @Field(() => Seller, { nullable: true })
  seller?: Seller;
}
