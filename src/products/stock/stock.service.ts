import { Injectable, Logger } from '@nestjs/common';
import { Prisma, StoreStockMovementKind } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestError } from '../../common/exceptions';
import type {
  StockAdjustmentResult,
  StockItemInput,
  StockMovementItem,
} from './stock.types';

/** Most lines one order can carry; a guard against a malformed call. */
const MAX_ITEMS = 200;

/**
 * Store stock after sales and refunds (STO-1).
 *
 * ekoru-transactions calls this when a store order is paid (SALE) and when it
 * is refunded (RESTOCK). Each call carries a reference, such as
 * `order:42:sale`, recorded in StoreStockMovement with a unique index, so a
 * retried webhook moves nothing the second time.
 *
 * A SALE takes what is there, at most what was ordered, and never drives stock
 * below zero. The money is already taken by then, so refusing the whole sale
 * would only hide it; instead the result reports each product's `applied`
 * units, and anything short is oversold for ekoru-transactions to refund
 * (TRX-3). A RESTOCK puts the given units back.
 */
@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(private readonly prisma: PrismaService) {}

  async adjust({
    reference,
    kind,
    items,
  }: {
    reference: string;
    kind: StoreStockMovementKind;
    items: StockItemInput[];
  }): Promise<StockAdjustmentResult> {
    const ref = reference.trim();
    if (!ref) throw new BadRequestError('A stock movement needs a reference');
    const wanted = this.mergeItems(items);

    const existing = await this.prisma.storeStockMovement.findUnique({
      where: { reference: ref },
    });
    if (existing) return this.toResult(existing, true);

    try {
      const movement = await this.prisma.$transaction(async (tx) => {
        const moved: StockMovementItem[] = [];
        for (const [storeProductId, requested] of wanted) {
          moved.push({
            storeProductId,
            requested,
            applied: await this.moveOne(tx, {
              storeProductId,
              requested,
              kind,
            }),
          });
        }
        return tx.storeStockMovement.create({
          data: {
            reference: ref,
            kind,
            items: moved as unknown as Prisma.InputJsonValue,
          },
        });
      });
      const result = this.toResult(movement, false);
      if (!result.complete) {
        this.logger.warn(
          `Stock movement ${ref} was short: ${JSON.stringify(result.items)}`,
        );
      }
      return result;
    } catch (error) {
      // Two calls with one reference at once: the loser's transaction rolls
      // back on the unique index, and it reports the winner's movement.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const winner = await this.prisma.storeStockMovement.findUnique({
          where: { reference: ref },
        });
        if (winner) return this.toResult(winner, true);
      }
      throw error;
    }
  }

  /**
   * Moves one product's stock inside the transaction and returns the units
   * moved. The row is locked first, so concurrent sales of the last unit
   * cannot both take it.
   */
  private async moveOne(
    tx: Prisma.TransactionClient,
    {
      storeProductId,
      requested,
      kind,
    }: {
      storeProductId: number;
      requested: number;
      kind: StoreStockMovementKind;
    },
  ): Promise<number> {
    const rows = await tx.$queryRaw<
      { stock: number; lowStockThreshold: number | null }[]
    >`SELECT "stock", "lowStockThreshold"
        FROM "StoreProduct"
       WHERE "id" = ${storeProductId}
       FOR UPDATE`;
    const row = rows[0];
    if (!row) return 0; // gone: nothing to move, reported as short

    const applied =
      kind === StoreStockMovementKind.SALE
        ? Math.min(Math.max(row.stock, 0), requested)
        : requested;
    const stock =
      kind === StoreStockMovementKind.SALE
        ? row.stock - applied
        : row.stock + applied;

    await tx.storeProduct.update({
      where: { id: storeProductId },
      data: {
        stock,
        isLowStock: stock <= (row.lowStockThreshold ?? 0),
        updatedAt: new Date(),
      },
    });
    return applied;
  }

  /** Validates the lines and adds up repeats of one product. */
  private mergeItems(items: StockItemInput[]): Map<number, number> {
    if (!items?.length) {
      throw new BadRequestError('A stock movement needs at least one item');
    }
    if (items.length > MAX_ITEMS) {
      throw new BadRequestError(`At most ${MAX_ITEMS} items per movement`);
    }
    const merged = new Map<number, number>();
    for (const { storeProductId, quantity } of items) {
      if (!Number.isInteger(storeProductId) || storeProductId <= 0) {
        throw new BadRequestError(`Invalid store product id ${storeProductId}`);
      }
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new BadRequestError(
          `Quantity for product ${storeProductId} must be a positive integer`,
        );
      }
      merged.set(storeProductId, (merged.get(storeProductId) ?? 0) + quantity);
    }
    return merged;
  }

  private toResult(
    movement: {
      reference: string;
      kind: StoreStockMovementKind;
      items: Prisma.JsonValue;
    },
    alreadyApplied: boolean,
  ): StockAdjustmentResult {
    const items = (movement.items ?? []) as unknown as StockMovementItem[];
    return {
      reference: movement.reference,
      kind: movement.kind,
      alreadyApplied,
      complete: items.every((i) => i.applied === i.requested),
      items,
    };
  }
}
