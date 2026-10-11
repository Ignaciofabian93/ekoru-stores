import { adminSellerScope, assertAdminCan } from './admin-access';
import { assertInternal } from './internal';
import { PrismaService } from '../prisma/prisma.service';

type Row = {
  adminType: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  sellerId: string | null;
};

const prismaReturning = (rows: Row[]) =>
  ({
    $queryRaw: jest.fn().mockResolvedValue(rows),
  }) as unknown as PrismaService;

const admin = (over: Partial<Row> = {}): Row => ({
  adminType: 'PLATFORM',
  role: 'MODERATOR',
  permissions: [],
  isActive: true,
  sellerId: null,
  ...over,
});

const codeOf = async (p: Promise<unknown>) => {
  try {
    await p;
    return 'OK';
  } catch (e) {
    return (e as { extensions?: { code?: string } }).extensions?.code;
  }
};

describe('assertAdminCan (SEC-8)', () => {
  it('rejects a signed-out caller as UNAUTHORIZED', async () => {
    expect(
      await codeOf(
        assertAdminCan(prismaReturning([]), undefined, 'MANAGE_PRODUCTS'),
      ),
    ).toBe('UNAUTHORIZED');
  });

  it('rejects a BUSINESS admin even with the permission, as FORBIDDEN', async () => {
    const prisma = prismaReturning([
      admin({
        adminType: 'BUSINESS',
        role: 'SUPER_ADMIN',
        permissions: ['MANAGE_PRODUCTS'],
      }),
    ]);
    expect(await codeOf(assertAdminCan(prisma, 'a1', 'MANAGE_PRODUCTS'))).toBe(
      'FORBIDDEN',
    );
  });

  it('rejects an inactive admin and a platform admin without the permission', async () => {
    expect(
      await codeOf(
        assertAdminCan(
          prismaReturning([admin({ isActive: false, role: 'SUPER_ADMIN' })]),
          'a1',
          'MANAGE_SETTINGS',
        ),
      ),
    ).toBe('FORBIDDEN');
    expect(
      await codeOf(
        assertAdminCan(
          prismaReturning([admin({ permissions: ['MANAGE_CATEGORIES'] })]),
          'a1',
          'MANAGE_PRODUCTS',
        ),
      ),
    ).toBe('FORBIDDEN');
  });

  it('accepts the permission, any of several, or SUPER_ADMIN', async () => {
    expect(
      await codeOf(
        assertAdminCan(
          prismaReturning([admin({ permissions: ['MANAGE_PRODUCTS'] })]),
          'a1',
          ['MANAGE_CATEGORIES', 'MANAGE_PRODUCTS'],
        ),
      ),
    ).toBe('OK');
    expect(
      await codeOf(
        assertAdminCan(
          prismaReturning([admin({ role: 'SUPER_ADMIN' })]),
          'a1',
          'MANAGE_SETTINGS',
        ),
      ),
    ).toBe('OK');
  });
});

describe('adminSellerScope', () => {
  it("limits a BUSINESS admin to their own seller's rows", async () => {
    await expect(
      adminSellerScope(
        prismaReturning([
          admin({ adminType: 'BUSINESS', sellerId: 'seller-9' }),
        ]),
        'a1',
        'MANAGE_PRODUCTS',
      ),
    ).resolves.toBe('seller-9');
  });

  it('gives a platform admin with the permission every row', async () => {
    await expect(
      adminSellerScope(
        prismaReturning([admin({ permissions: ['MANAGE_PRODUCTS'] })]),
        'a1',
        'MANAGE_PRODUCTS',
      ),
    ).resolves.toBeUndefined();
  });
});

describe('assertInternal', () => {
  const saved = process.env.INTERNAL_SERVICE_SECRET;
  afterEach(() => {
    process.env.INTERNAL_SERVICE_SECRET = saved;
  });

  it('accepts only the exact shared secret, and fails closed without one', () => {
    process.env.INTERNAL_SERVICE_SECRET = 'shh-123';
    expect(() => assertInternal('shh-123')).not.toThrow();
    expect(() => assertInternal('shh-124')).toThrow();
    expect(() => assertInternal(undefined)).toThrow();
    delete process.env.INTERNAL_SERVICE_SECRET;
    expect(() => assertInternal('')).toThrow();
  });
});
