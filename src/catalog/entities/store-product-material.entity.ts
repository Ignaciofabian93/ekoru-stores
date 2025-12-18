import { ObjectType, Field, ID, Int, Float, Directive } from '@nestjs/graphql';
import { MaterialImpactEstimate } from './material-impact-estimate.entity';
import { StoreProduct } from './store-product.entity';

@ObjectType()
@Directive('@key(fields: "id")')
export class StoreProductMaterial {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  storeProductId: number;

  @Field(() => ID)
  materialTypeId: string;

  @Field(() => Float)
  quantity: number;

  @Field()
  unit: string;

  @Field()
  isPrimary: boolean;

  @Field(() => String, { nullable: true })
  sourceMaterial?: string | null;

  @Field()
  isRecycled: boolean;

  @Field(() => Float, { nullable: true })
  recycledPercentage?: number | null;

  @Field()
  supplierVerified: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => StoreProduct, { nullable: true })
  storeProduct?: StoreProduct;

  @Field(() => MaterialImpactEstimate, { nullable: true })
  material?: MaterialImpactEstimate;
}
