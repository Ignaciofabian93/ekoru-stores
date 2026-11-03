import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * The shared contract of a bulk write (XLSX import or row edit): each row is
 * written on its own, so one bad line never aborts the batch, and the result
 * names every failed row by its position in the file.
 */
export type BulkOutcome = { outcome: 'created' | 'updated'; id: number };

export type BulkResult = {
  created: number;
  updated: number;
  failed: number;
  createdIds: number[];
  errors: { index: number; id?: number | null; message: string }[];
};

/** Keeps only the keys a row sent; `null` stays, to clear a column. */
export function pickDefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

/** A row error a person can act on, for the database errors rows hit most. */
export function bulkErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const target = Array.isArray(error.meta?.target)
      ? ` (${(error.meta.target as string[]).join(', ')})`
      : '';
    switch (error.code) {
      case 'P2002':
        return `Duplicate value violates a unique constraint${target}`;
      case 'P2003':
        return 'Invalid relation: the referenced id does not exist, or dependent rows still reference this one';
      case 'P2025':
        return 'Row not found';
      default:
        return `Database error ${error.code}`;
    }
  }
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

/** Runs `handler` on each row in order and tallies the outcomes. */
export async function processBulkRows<T extends { id?: number | null }>(
  logger: Logger,
  rows: T[],
  handler: (row: T, index: number) => Promise<BulkOutcome>,
): Promise<BulkResult> {
  const result: BulkResult = {
    created: 0,
    updated: 0,
    failed: 0,
    createdIds: [],
    errors: [],
  };

  for (const [index, row] of rows.entries()) {
    try {
      const { outcome, id } = await handler(row, index);
      result[outcome] += 1;
      if (outcome === 'created') result.createdIds.push(id);
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        index,
        id: row.id ?? null,
        message: bulkErrorMessage(error),
      });
    }
  }

  if (result.failed > 0) {
    logger.warn(
      `Bulk upsert finished with ${result.failed} failed row(s): ` +
        result.errors
          .map((e) => `#${e.index}${e.id ? ` (id ${e.id})` : ''}: ${e.message}`)
          .join(' | '),
    );
  }

  return result;
}
