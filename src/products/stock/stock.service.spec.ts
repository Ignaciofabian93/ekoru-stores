import { Prisma, StoreStockMovementKind } from '@prisma/client';
import { StockService } from './stock.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestError } from '../../common/exceptions';

/**
 * An in-memory StoreProduct table behind the bits of Prisma the stock service
 * uses: the locking SELECT, the stock update, and the movement log with its
 * unique reference.
 */
function fakePrisma(stock: Record<number, number>) {
  const products = new Map(
    Object.entries(stock).map(([id, s]) => [
      Number(id),
      { stock: s, lowStockThreshold: 5, isLowStock: false },
    ]),
  );
  const movements = new Map<string, Record<string, unknown>>();
  const tx = {
    $queryRaw: jest.fn((_sql: TemplateStringsArray, id: number) => {
      const p = products.get(id);
      return Promise.resolve(
        p ? [{ stock: p.stock, lowStockThreshold: p.lowStockThreshold }] : [],
      );
    }),
    storeProduct: {
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: number };
          data: { stock: number; isLowStock: boolean };
        }) => {
          const p = products.get(where.id)!;
          p.stock = data.stock;
          p.isLowStock = data.isLowStock;
          return Promise.resolve(p);
        },
      ),
    },
    storeStockMovement: {
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        movements.set(data.reference as string, data);
        return Promise.resolve(data);
      }),
    },
  };
  const prisma = {
    storeStockMovement: {
      findUnique: jest.fn(({ where }: { where: { reference: string } }) =>
        Promise.resolve(movements.get(where.reference) ?? null),
      ),
    },
    $transaction: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  return { prisma: prisma as unknown as PrismaService, products, tx };
}

describe('StockService (STO-1)', () => {
  const sale = StoreStockMovementKind.SALE;
  const restock = StoreStockMovementKind.RESTOCK;

  it('takes sold units out of stock and flags low stock', async () => {
    const { prisma, products } = fakePrisma({ 1: 10, 2: 3 });
    const result = await new StockService(prisma).adjust({
      reference: 'order:42:sale',
      kind: sale,
      items: [
        { storeProductId: 1, quantity: 6 },
        { storeProductId: 2, quantity: 1 },
      ],
    });

    expect(result).toMatchObject({ alreadyApplied: false, complete: true });
    expect(products.get(1)).toMatchObject({ stock: 4, isLowStock: true });
    expect(products.get(2)).toMatchObject({ stock: 2 });
  });

  it('never goes below zero and reports what was oversold', async () => {
    const { prisma, products } = fakePrisma({ 1: 2 });
    const result = await new StockService(prisma).adjust({
      reference: 'order:7:sale',
      kind: sale,
      items: [{ storeProductId: 1, quantity: 5 }],
    });

    expect(products.get(1)!.stock).toBe(0);
    expect(result.complete).toBe(false);
    expect(result.items).toEqual([
      { storeProductId: 1, requested: 5, applied: 2 },
    ]);
  });

  it('reports a product that no longer exists as not applied', async () => {
    const { prisma } = fakePrisma({});
    const result = await new StockService(prisma).adjust({
      reference: 'order:8:sale',
      kind: sale,
      items: [{ storeProductId: 99, quantity: 1 }],
    });
    expect(result.items).toEqual([
      { storeProductId: 99, requested: 1, applied: 0 },
    ]);
  });

  it('applies a reference once: a retried webhook moves nothing', async () => {
    const { prisma, products } = fakePrisma({ 1: 10 });
    const service = new StockService(prisma);
    const call = () =>
      service.adjust({
        reference: 'order:42:sale',
        kind: sale,
        items: [{ storeProductId: 1, quantity: 3 }],
      });

    await call();
    const second = await call();

    expect(second.alreadyApplied).toBe(true);
    expect(products.get(1)!.stock).toBe(7);
  });

  it('puts refunded units back', async () => {
    const { prisma, products } = fakePrisma({ 1: 0 });
    const result = await new StockService(prisma).adjust({
      reference: 'refund:3:restock',
      kind: restock,
      items: [{ storeProductId: 1, quantity: 2 }],
    });
    expect(result.complete).toBe(true);
    expect(products.get(1)!.stock).toBe(2);
  });

  it('adds up repeated lines for one product', async () => {
    const { prisma, products } = fakePrisma({ 1: 10 });
    await new StockService(prisma).adjust({
      reference: 'order:9:sale',
      kind: sale,
      items: [
        { storeProductId: 1, quantity: 2 },
        { storeProductId: 1, quantity: 3 },
      ],
    });
    expect(products.get(1)!.stock).toBe(5);
  });

  it('reports the winner when two calls race on one reference', async () => {
    const { prisma } = fakePrisma({ 1: 10 });
    const winner = {
      reference: 'order:42:sale',
      kind: sale,
      items: [{ storeProductId: 1, requested: 1, applied: 1 }],
    };
    (prisma.storeStockMovement.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(winner);
    (prisma.$transaction as jest.Mock).mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    const result = await new StockService(prisma).adjust({
      reference: 'order:42:sale',
      kind: sale,
      items: [{ storeProductId: 1, quantity: 1 }],
    });
    expect(result).toMatchObject({ alreadyApplied: true, complete: true });
  });

  it('refuses an empty reference, no items or a bad quantity', async () => {
    const { prisma } = fakePrisma({ 1: 10 });
    const service = new StockService(prisma);
    await expect(
      service.adjust({
        reference: ' ',
        kind: sale,
        items: [{ storeProductId: 1, quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      service.adjust({ reference: 'r', kind: sale, items: [] }),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      service.adjust({
        reference: 'r',
        kind: sale,
        items: [{ storeProductId: 1, quantity: 0 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
