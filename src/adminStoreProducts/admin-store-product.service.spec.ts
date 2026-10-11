import { AdminStoreProductService } from './admin-store-product.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminStoreProductService', () => {
  const productsAdmin = {
    adminType: 'PLATFORM',
    role: 'MODERATOR',
    permissions: ['MANAGE_PRODUCTS'],
    isActive: true,
    sellerId: null,
  };

  function make(totals: { storeProductId: number; total: number }[]) {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([productsAdmin]),
      storeProductMaterialComposition: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([{ id: 70, storeProductId: 3 }]),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue({ id: 70 }),
        groupBy: jest.fn().mockResolvedValue(
          totals.map((t) => ({
            storeProductId: t.storeProductId,
            _sum: { percentage: t.total },
          })),
        ),
      },
    };
    return {
      prisma,
      service: new AdminStoreProductService(prisma as unknown as PrismaService),
    };
  }

  describe('materials import (STO-5)', () => {
    it('reports each product whose materials do not add up to 100%', async () => {
      const { service } = make([
        { storeProductId: 1, total: 100 },
        { storeProductId: 2, total: 90 },
      ]);

      const result = await service.bulkUpsertStoreProductMaterials({
        adminId: 'a1',
        rows: [
          { storeProductId: 1, materialTypeId: 1, percentage: 60 },
          { storeProductId: 1, materialTypeId: 2, percentage: 40 },
          { storeProductId: 2, materialTypeId: 1, percentage: 90 },
        ],
      });

      // Rows are written; the bad total is reported against product 2's row.
      expect(result.created).toBe(3);
      expect(result.errors).toEqual([
        expect.objectContaining({
          index: 2,
          message: expect.stringContaining('90%'),
        }),
      ]);
    });

    it('finds the product of a row that only carries its own id', async () => {
      const { service, prisma } = make([{ storeProductId: 3, total: 70 }]);

      const result = await service.bulkUpsertStoreProductMaterials({
        adminId: 'a1',
        rows: [{ id: 70, percentage: 70 }],
      });

      expect(
        prisma.storeProductMaterialComposition.groupBy,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ where: { storeProductId: { in: [3] } } }),
      );
      expect(result.errors[0].message).toContain('Store product 3');
    });

    it('says nothing when every total is right', async () => {
      const { service } = make([{ storeProductId: 1, total: 100 }]);
      const result = await service.bulkUpsertStoreProductMaterials({
        adminId: 'a1',
        rows: [{ storeProductId: 1, materialTypeId: 1, percentage: 100 }],
      });
      expect(result.errors).toEqual([]);
    });
  });
});
