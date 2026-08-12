import { ObjectType, Field, ID, Int, Directive } from '@nestjs/graphql';
import { PageInfoEntity } from '../../products/entities/page-info.entity';

/**
 * A buyer's rating of a store product.
 *
 * `isVerifiedPurchase` is not a client-supplied flag: the subgraph only accepts
 * a review from someone with a paid order for the product, so every row it
 * writes is verified. The field stays because older rows predate that rule.
 */
@ObjectType('StoreProductReview')
@Directive('@key(fields: "id")')
export class StoreProductReviewEntity {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  storeProductId: number;

  @Field(() => String, { description: 'Seller id of the reviewer.' })
  userId: string;

  @Field(() => Int, { description: '1–5.' })
  rating: number;

  @Field(() => String, { nullable: true })
  comment?: string | null;

  @Field(() => [String])
  images: string[];

  @Field(() => Boolean)
  isVerifiedPurchase: boolean;

  @Field(() => Int)
  helpfulCount: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType('StoreProductReviewConnection')
export class StoreProductReviewConnectionEntity {
  @Field(() => [StoreProductReviewEntity])
  nodes: StoreProductReviewEntity[];

  @Field(() => PageInfoEntity)
  pageInfo: PageInfoEntity;
}
