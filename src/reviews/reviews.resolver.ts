import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { CurrentSeller } from '../common/decorators';
import { ReviewsService } from './reviews.service';
import {
  StoreProductReviewEntity,
  StoreProductReviewConnectionEntity,
} from './entities/store-product-review.entity';
import { AddStoreProductReviewInput } from './dto/store-product-review.input';

@Resolver(() => StoreProductReviewEntity)
export class ReviewsResolver {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Query(() => StoreProductReviewConnectionEntity, {
    name: 'getStoreProductReviews',
    description: 'Reviews for a store product, newest first. Public.',
  })
  getStoreProductReviews(
    @Args('storeProductId', { type: () => ID }) storeProductId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
  ) {
    return this.reviewsService.getStoreProductReviews({
      storeProductId: parseInt(storeProductId, 10),
      page,
      pageSize,
    });
  }

  @Mutation(() => StoreProductReviewEntity, {
    name: 'addStoreProductReview',
    description:
      'Review a store product. The reviewer comes from the session and must ' +
      'have a paid order for the product.',
  })
  addStoreProductReview(
    @Args('input') input: AddStoreProductReviewInput,
    @CurrentSeller() userId: string,
  ) {
    return this.reviewsService.addStoreProductReview({ input, userId });
  }

  @Mutation(() => Boolean, {
    name: 'deleteStoreProductReview',
    description: 'Delete your own review.',
  })
  deleteStoreProductReview(
    @Args('id', { type: () => ID }) id: string,
    @CurrentSeller() userId: string,
  ) {
    return this.reviewsService.deleteStoreProductReview({
      id: parseInt(id, 10),
      userId,
    });
  }
}
