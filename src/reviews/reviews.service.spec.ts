import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestError, UnAuthorizedError } from '../common/exceptions';

describe('ReviewsService (store product reviews)', () => {
  function make({ bought, reviewed }: { bought: boolean; reviewed: boolean }) {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ exists: bought }]),
      storeProductReview: {
        findUnique: jest.fn().mockResolvedValue(reviewed ? { id: 9 } : null),
        create: jest.fn().mockResolvedValue({ id: 1, rating: 5 }),
        aggregate: jest
          .fn()
          .mockResolvedValue({ _avg: { rating: 4.5 }, _count: { rating: 2 } }),
      },
      storeProduct: { update: jest.fn().mockResolvedValue({}) },
    };
    return {
      prisma,
      service: new ReviewsService(prisma as unknown as PrismaService),
    };
  }
  const input = { storeProductId: 3, rating: 5, comment: 'Muy bueno' };

  it('accepts a review from a buyer with a paid order and refreshes the rating', async () => {
    const { service, prisma } = make({ bought: true, reviewed: false });

    await service.addStoreProductReview({ input, userId: 'buyer' });

    expect(prisma.storeProductReview.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isVerifiedPurchase: true,
        userId: 'buyer',
      }),
    });
    expect(prisma.storeProduct.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { averageRating: 4.5, reviewsNumber: 2 },
    });
  });

  it('refuses someone who never paid for the product', async () => {
    const { service, prisma } = make({ bought: false, reviewed: false });
    await expect(
      service.addStoreProductReview({ input, userId: 'stranger' }),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(prisma.storeProductReview.create).not.toHaveBeenCalled();
  });

  it('refuses a second review and an anonymous caller', async () => {
    await expect(
      make({ bought: true, reviewed: true }).service.addStoreProductReview({
        input,
        userId: 'buyer',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      make({ bought: true, reviewed: false }).service.addStoreProductReview({
        input,
        userId: '',
      }),
    ).rejects.toBeInstanceOf(UnAuthorizedError);
  });

  it('lets a moderator remove a review and recomputes the rating (ADM-4)', async () => {
    const { service, prisma } = make({ bought: true, reviewed: false });
    Object.assign(prisma.storeProductReview, {
      findUnique: jest.fn().mockResolvedValue({ storeProductId: 3 }),
      delete: jest.fn().mockResolvedValue({}),
    });

    await expect(service.deleteReviewAsModerator(9)).resolves.toBe(true);

    expect(prisma.storeProduct.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { averageRating: 4.5, reviewsNumber: 2 },
    });
  });
});
