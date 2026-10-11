import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../common/i18n';
import { AddStoreProductInput } from './dto/product.input';

describe('ProductsService', () => {
  let prisma: {
    $queryRaw: jest.Mock;
    storeProduct: Record<string, jest.Mock>;
    materialImpactEstimate: { findMany: jest.Mock };
  };
  let service: ProductsService;

  // The raw SQL calls this service makes: the hidden-seller list and, for
  // admins, the Admin row (SEC-8).
  const hidden: { sellerId: string }[] = [];
  let adminRow: Record<string, unknown> | null = null;
  let publisher: Record<string, unknown>[] = [];

  beforeEach(() => {
    hidden.length = 0;
    adminRow = null;
    publisher = [
      { isActive: true, approvalStatus: 'APPROVED', businessType: 'RETAIL' },
    ];
    prisma = {
      $queryRaw: jest.fn((strings: TemplateStringsArray) => {
        const sql = strings.join('?');
        if (sql.includes('FROM "Admin"')) {
          return Promise.resolve(adminRow ? [adminRow] : []);
        }
        if (
          sql.includes('LEFT JOIN "BusinessProfile"') &&
          !sql.includes('"StoreProduct"')
        ) {
          return Promise.resolve(publisher);
        }
        return Promise.resolve(hidden);
      }),
      storeProduct: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue({ id: 1 }),
      },
      materialImpactEstimate: { findMany: jest.fn() },
    };
    const i18n = {
      getDefaultLanguage: () => 'ES',
      translate: (key: string) => key,
    } as unknown as I18nService;
    service = new ProductsService(prisma as unknown as PrismaService, i18n);
  });

  describe('composition (every store product declares what it is made of)', () => {
    const base = {
      name: 'Polera',
      description: 'Algodón',
      stock: 3,
      price: 9990,
      subCategoryId: 1,
    } as unknown as AddStoreProductInput;
    const add = (materials: { materialTypeId: number; percentage: number }[]) =>
      service.addProduct({
        input: { ...base, materials } as AddStoreProductInput,
        sellerId: 'seller-1',
      });

    it('accepts a composition that adds up to 100% (with rounding slack)', async () => {
      prisma.materialImpactEstimate.findMany.mockResolvedValue([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);
      await expect(
        add([
          { materialTypeId: 1, percentage: 33.33 },
          { materialTypeId: 2, percentage: 33.33 },
          { materialTypeId: 3, percentage: 33.34 },
        ]),
      ).resolves.toBeDefined();
    });

    it.each([
      ['no materials', []],
      [
        'a material listed twice',
        [
          { materialTypeId: 1, percentage: 50 },
          { materialTypeId: 1, percentage: 50 },
        ],
      ],
      ['a total of 90%', [{ materialTypeId: 1, percentage: 90 }]],
    ])('refuses %s', async (_label, materials) => {
      await expect(add(materials)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.storeProduct.create).not.toHaveBeenCalled();
    });

    it.each([
      [
        'a business EKORU has not approved',
        [{ isActive: true, approvalStatus: 'PENDING', businessType: 'RETAIL' }],
      ],
      [
        'a services-only business',
        [
          {
            isActive: true,
            approvalStatus: 'APPROVED',
            businessType: 'SERVICES',
          },
        ],
      ],
      [
        'a banned or deactivated account',
        [
          {
            isActive: false,
            approvalStatus: 'APPROVED',
            businessType: 'MIXED',
          },
        ],
      ],
      [
        'a person account',
        [{ isActive: true, approvalStatus: null, businessType: null }],
      ],
    ])('refuses publishing from %s', async (_label, rows) => {
      publisher = rows;
      await expect(
        add([{ materialTypeId: 1, percentage: 100 }]),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.storeProduct.create).not.toHaveBeenCalled();
    });

    it('refuses an unknown material', async () => {
      prisma.materialImpactEstimate.findMany.mockResolvedValue([]);
      await expect(
        add([{ materialTypeId: 404, percentage: 100 }]),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('hidden sellers (STO-2)', () => {
    it("keeps a hidden seller's products out of listings, with the viewer's own excluded too", async () => {
      hidden.push({ sellerId: 'banned-1' });
      await service.getProducts({
        page: 1,
        pageSize: 10,
        excludeSellerId: 'me',
      });
      const where = prisma.storeProduct.findMany.mock.calls[0][0].where;
      expect(where.sellerId).toEqual({ notIn: ['banned-1', 'me'] });
    });

    it("keeps them out of checkout's product lookup", async () => {
      hidden.push({ sellerId: 'banned-1' });
      await service.getProductsByIds([1, 2]);
      expect(prisma.storeProduct.findMany.mock.calls[0][0].where).toEqual({
        id: { in: [1, 2] },
        deletedAt: null,
        sellerId: { notIn: ['banned-1'] },
      });
    });

    it("shows a hidden seller's shop as empty", async () => {
      hidden.push({ sellerId: 'banned-1' });
      const page = await service.getProductsBySeller({
        sellerId: 'banned-1',
        page: 1,
        pageSize: 10,
      });
      expect(page.nodes).toEqual([]);
      expect(prisma.storeProduct.findMany).not.toHaveBeenCalled();
    });

    it('treats a hidden or deleted product page as not found', async () => {
      hidden.push({ sellerId: 'banned-1' });
      prisma.storeProduct.findFirst.mockResolvedValue(null);
      await expect(service.getProductById(5)).rejects.toThrow();
      expect(prisma.storeProduct.findFirst.mock.calls[0][0].where).toEqual({
        id: 5,
        deletedAt: null,
        sellerId: { notIn: ['banned-1'] },
      });
    });

    it('reads the hidden list once per 30 seconds, not per query', async () => {
      await service.getProducts({ page: 1, pageSize: 10 });
      await service.getProducts({ page: 2, pageSize: 10 });
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });

  it('filters a price range by both bounds', async () => {
    await service.getProducts({
      page: 1,
      pageSize: 10,
      filter: { minPrice: 1000, maxPrice: 5000 },
    });
    expect(prisma.storeProduct.findMany.mock.calls[0][0].where.price).toEqual({
      gte: 1000,
      lte: 5000,
    });
  });

  describe('ownership (SEC-8)', () => {
    beforeEach(() => {
      prisma.storeProduct.findUnique.mockResolvedValue({
        id: 1,
        sellerId: 'owner',
        isActive: true,
      });
    });

    it('lets the owner toggle their product', async () => {
      await expect(
        service.toggleProductActive({ id: 1, sellerId: 'owner' }),
      ).resolves.toBeDefined();
    });

    it('refuses another seller', async () => {
      await expect(
        service.toggleProductActive({ id: 1, sellerId: 'someone' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.storeProduct.update).not.toHaveBeenCalled();
    });

    it('refuses a business admin, even one holding MANAGE_PRODUCTS', async () => {
      adminRow = {
        adminType: 'BUSINESS',
        role: 'SUPER_ADMIN',
        permissions: ['MANAGE_PRODUCTS'],
        isActive: true,
        sellerId: 'someone',
      };
      await expect(
        service.deleteProduct({ id: 1, adminId: 'a1' }),
      ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
      expect(prisma.storeProduct.update).not.toHaveBeenCalled();
    });

    it('lets a platform admin with MANAGE_PRODUCTS act on any product', async () => {
      adminRow = {
        adminType: 'PLATFORM',
        role: 'MODERATOR',
        permissions: ['MANAGE_PRODUCTS'],
        isActive: true,
        sellerId: null,
      };
      await expect(
        service.deleteProduct({ id: 1, adminId: 'a1' }),
      ).resolves.toBeDefined();
    });
  });
});
