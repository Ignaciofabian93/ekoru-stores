import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestError,
  InternalServerError,
  UnAuthorizedError,
} from '../common/exceptions';
import {
  calculatePrismaParams,
  createPaginatedResponse,
} from '../common/utils/pagination';
import { AddStoreProductReviewInput } from './dto/store-product-review.input';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStoreProductReviews({
    storeProductId,
    page,
    pageSize,
  }: {
    storeProductId: number;
    page: number;
    pageSize: number;
  }) {
    try {
      const { skip, take } = calculatePrismaParams(page, pageSize);
      const [totalCount, reviews] = await Promise.all([
        this.prisma.storeProductReview.count({ where: { storeProductId } }),
        this.prisma.storeProductReview.findMany({
          where: { storeProductId },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return createPaginatedResponse(reviews, page, pageSize, totalCount);
    } catch (error) {
      this.logger.error('Error fetching store product reviews:', error);
      throw new InternalServerError('Error al obtener las reseñas');
    }
  }

  /**
   * Writes a review, but only from a buyer who actually paid for the product.
   *
   * Orders live in the transactions subgraph, not this one — same database,
   * different schema owner — so the check is raw SQL, the convention this repo
   * already uses for cross-subgraph reads.
   */
  async addStoreProductReview({
    input,
    userId,
  }: {
    input: AddStoreProductReviewInput;
    userId: string;
  }) {
    if (!userId) {
      throw new UnAuthorizedError('Debes iniciar sesión para reseñar');
    }

    try {
      const existing = await this.prisma.storeProductReview.findUnique({
        where: {
          storeProductId_userId: {
            storeProductId: input.storeProductId,
            userId,
          },
        },
        select: { id: true },
      });
      if (existing) {
        throw new BadRequestError('Ya has reseñado este producto');
      }

      const purchased = await this.prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1
            FROM "OrderItem" oi
            JOIN "Order" o ON o."id" = oi."orderId"
           WHERE oi."storeProductId" = ${input.storeProductId}
             AND o."buyerId" = ${userId}
             AND o."status" = 'PAID'
        ) AS "exists"`;
      if (!purchased[0]?.exists) {
        throw new BadRequestError(
          'Solo puedes reseñar productos que hayas comprado',
        );
      }

      const review = await this.prisma.storeProductReview.create({
        data: {
          storeProductId: input.storeProductId,
          userId,
          rating: input.rating,
          comment: input.comment,
          images: input.images ?? [],
          isVerifiedPurchase: true,
        },
      });

      await this.recomputeProductRating(input.storeProductId);

      return review;
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof UnAuthorizedError
      ) {
        throw error;
      }
      this.logger.error('Error creating store product review:', error);
      throw new InternalServerError('Error al crear la reseña');
    }
  }

  /** Authors delete their own reviews; nobody deletes anyone else's. */
  async deleteStoreProductReview({
    id,
    userId,
  }: {
    id: number;
    userId: string;
  }): Promise<boolean> {
    if (!userId) {
      throw new UnAuthorizedError('Debes iniciar sesión');
    }

    try {
      const review = await this.prisma.storeProductReview.findUnique({
        where: { id },
        select: { userId: true, storeProductId: true },
      });
      if (!review) return false;
      if (review.userId !== userId) {
        throw new UnAuthorizedError('Solo puedes eliminar tus propias reseñas');
      }

      await this.prisma.storeProductReview.delete({ where: { id } });
      await this.recomputeProductRating(review.storeProductId);

      return true;
    } catch (error) {
      if (error instanceof UnAuthorizedError) throw error;
      this.logger.error('Error deleting store product review:', error);
      return false;
    }
  }

  /**
   * `StoreProduct.averageRating` and `reviewsNumber` are stored columns that
   * every listing reads, so they are refreshed here. Without this the rating a
   * shopper sees never reflects the reviews underneath it.
   */
  private async recomputeProductRating(storeProductId: number): Promise<void> {
    const { _avg, _count } = await this.prisma.storeProductReview.aggregate({
      where: { storeProductId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.storeProduct.update({
      where: { id: storeProductId },
      data: {
        averageRating: _avg.rating ?? 0,
        reviewsNumber: _count.rating,
      },
    });
  }
}
