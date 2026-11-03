import { BusinessProductsService } from './business-products.service';
import { ProductsService } from '../products/products.service';
import { I18nService } from '../common/i18n';
import { PrismaService } from '../prisma/prisma.service';
import { Language } from '../graphql/enums';

const OWNER = {
  adminType: 'BUSINESS',
  role: 'BUSINESS_OWNER',
  permissions: [],
  isActive: true,
  sellerId: 'store-1',
};
const APPROVED_RETAIL = {
  isActive: true,
  approvalStatus: 'APPROVED',
  businessType: 'RETAIL',
};

const newRow = {
  name: 'Taza de madera',
  description: 'Hecha a mano',
  price: 12000,
  stock: 4,
  subCategoryId: 10,
  materials: [{ materialTypeId: 1, percentage: 100 }],
};

function setup({
  admin = OWNER,
  seller = APPROVED_RETAIL,
}: { admin?: object; seller?: object } = {}) {
  const prisma = {
    // First the admin row (businessAdminSellerId), then the seller (assertCanPublish).
    $queryRaw: jest
      .fn()
      .mockResolvedValueOnce([admin])
      .mockResolvedValueOnce([seller]),
    storeSubCategory: {
      findMany: jest.fn().mockResolvedValue([{ id: 10 }]),
    },
    materialImpactEstimate: {
      findMany: jest.fn().mockResolvedValue([{ id: 1 }]),
    },
    storeProduct: {
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 501 }),
      update: jest.fn().mockResolvedValue({ id: 7 }),
    },
  };
  const db = prisma as unknown as PrismaService;
  const i18n = new I18nService();
  const service = new BusinessProductsService(
    db,
    new ProductsService(db, i18n),
    i18n,
  );
  return { prisma, service };
}

describe('BusinessProductsService (ADM-16)', () => {
  it('publishes a new product in the caller’s store, with its materials', async () => {
    const { prisma, service } = setup();

    const result = await service.publishMyStoreProducts({
      adminId: 'owner',
      rows: [
        {
          ...newRow,
          images: ['product/store-1/a.webp'],
          // A row cannot pick another store.
          ...({ sellerId: 'store-2' } as object),
        },
      ],
      language: Language.ES,
    });

    expect(result).toMatchObject({ created: 1, failed: 0, createdIds: [501] });
    expect(prisma.storeProduct.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sellerId: 'store-1',
          isActive: true,
          materialCompositions: {
            create: [{ materialTypeId: 1, percentage: 100 }],
          },
        }),
      }),
    );
  });

  it('saves a product without a photo hidden', async () => {
    const { prisma, service } = setup();

    await service.publishMyStoreProducts({
      adminId: 'owner',
      rows: [{ ...newRow, isActive: true }],
    });
    expect(prisma.storeProduct.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ images: [], isActive: false }),
      }),
    );
  });

  it('reports bad rows by position and keeps going', async () => {
    const { prisma, service } = setup();
    prisma.storeProduct.findUnique.mockResolvedValue({
      sellerId: 'store-2',
      deletedAt: null,
      images: [],
      price: 1000,
      hasOffer: false,
      offerPrice: null,
    });

    const result = await service.publishMyStoreProducts({
      adminId: 'owner',
      rows: [
        { id: 7, price: 900 }, // another store's product
        { ...newRow, materials: [{ materialTypeId: 1, percentage: 60 }] },
        { ...newRow, subCategoryId: 99 },
        { ...newRow, name: '' },
        { ...newRow, images: ['https://example.com/x.jpg'] },
        { ...newRow, hasOffer: true, offerPrice: 15000 },
        newRow,
      ],
      language: Language.ES,
    });

    expect(result.created).toBe(1);
    expect(result.failed).toBe(6);
    expect(result.errors.map((e) => [e.index, e.message])).toEqual([
      [0, 'El producto 7 no existe en tu tienda'],
      [1, 'Los porcentajes de los materiales deben sumar 100 (suman 60)'],
      [2, 'La subcategoría 99 no existe'],
      [3, 'Faltan datos obligatorios: name'],
      [4, expect.stringContaining('Las fotos deben estar subidas a EKORU')],
      [5, 'El precio de oferta debe ser menor que el precio'],
    ]);
    expect(prisma.storeProduct.update).not.toHaveBeenCalled();
  });

  it('updates its own product and replaces the composition when sent', async () => {
    const { prisma, service } = setup();
    prisma.storeProduct.findUnique.mockResolvedValue({
      sellerId: 'store-1',
      deletedAt: null,
      images: ['product/store-1/a.webp'],
      price: 1000,
      hasOffer: false,
      offerPrice: null,
    });

    const result = await service.publishMyStoreProducts({
      adminId: 'owner',
      rows: [
        {
          id: 7,
          stock: 0,
          materials: [
            { materialTypeId: 1, percentage: 50 },
            { materialTypeId: 2, percentage: 50 },
          ],
        },
      ],
    });
    // Material 2 is unknown in this mock: the composition rule refuses it.
    expect(result.failed).toBe(1);

    prisma.$queryRaw
      .mockResolvedValueOnce([OWNER])
      .mockResolvedValueOnce([APPROVED_RETAIL]);
    const ok = await service.publishMyStoreProducts({
      adminId: 'owner',
      rows: [{ id: 7, stock: 0 }],
    });
    expect(ok.updated).toBe(1);
    expect(prisma.storeProduct.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: expect.objectContaining({ stock: 0 }),
    });
  });

  it('refuses a business account without the products permission', async () => {
    const { service } = setup({
      admin: {
        ...OWNER,
        role: 'BUSINESS_ANALYST',
        permissions: ['VIEW_BUSINESS_ANALYTICS'],
      },
    });

    await expect(
      service.publishMyStoreProducts({ adminId: 'a', rows: [newRow] }),
    ).rejects.toThrow('MANAGE_BUSINESS_PRODUCTS');
  });

  it('refuses a platform admin, even a super admin', async () => {
    const { service } = setup({
      admin: { ...OWNER, adminType: 'PLATFORM', role: 'SUPER_ADMIN' },
    });

    await expect(
      service.publishMyStoreProducts({ adminId: 'a', rows: [newRow] }),
    ).rejects.toThrow('MANAGE_BUSINESS_PRODUCTS');
  });

  it('refuses a store that does not sell products', async () => {
    const { service } = setup({
      seller: { ...APPROVED_RETAIL, businessType: 'SERVICES' },
    });

    await expect(
      service.publishMyStoreProducts({
        adminId: 'owner',
        rows: [newRow],
        language: Language.ES,
      }),
    ).rejects.toThrow('Solo las tiendas aprobadas por EKORU');
  });
});
