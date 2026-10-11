import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { CurrentAdmin, CurrentSeller } from '../common/decorators';
import { PrismaService } from '../prisma/prisma.service';
import { assertAdminCan } from '../common/admin-access';
import { ReviewsService } from './reviews.service';
import {
  StoreProductReviewEntity,
  StoreProductReviewConnectionEntity,
} from './entities/store-product-review.entity';
import { AddStoreProductReviewInput } from './dto/store-product-review.input';

@Resolver(() => StoreProductReviewEntity)
export class ReviewsResolver {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => StoreProductReviewConnectionEntity, {
    name: 'adminStoreProductReviews',
    description:
      'Every store product review, newest first, for moderation. Platform admins with MODERATE_CONTENT.',
  })
  async adminStoreProductReviews(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 20 }) pageSize: number,
    @Args('storeProductId', { type: () => Int, nullable: true })
    storeProductId?: number,
    @Args('sellerId', { type: () => ID, nullable: true }) sellerId?: string,
    @Args('userId', { type: () => ID, nullable: true }) userId?: string,
    @Args('rating', { type: () => Int, nullable: true }) rating?: number,
    @CurrentAdmin() adminId?: string,
  ) {
    await assertAdminCan(this.prisma, adminId, 'MODERATE_CONTENT');
    return this.reviewsService.getReviewsForModeration({
      page,
      pageSize,
      storeProductId,
      sellerId,
      userId,
      rating,
    });
  }

  @Mutation(() => Boolean, {
    name: 'deleteStoreProductReviewByAdmin',
    description:
      "Removes any review and recomputes the product's rating. Platform admins with MODERATE_CONTENT.",
  })
  async deleteStoreProductReviewByAdmin(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    await assertAdminCan(this.prisma, adminId, 'MODERATE_CONTENT');
    return this.reviewsService.deleteReviewAsModerator(id);
  }

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
