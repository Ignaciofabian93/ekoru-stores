import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculatePrismaParams,
  createPaginatedResponse,
} from '../common/utils';
import {
  StoreCategoryUpsertRowInput,
  StoreCategoryTranslationUpsertRowInput,
  StoreSubCategoryUpsertRowInput,
  StoreSubCategoryTranslationUpsertRowInput,
} from './dto';

type BulkOutcome = { outcome: 'created' | 'updated'; id: number };

type BulkResult = {
  created: number;
  updated: number;
  failed: number;
  createdIds: number[];
  errors: { index: number; id?: number | null; message: string }[];
};

/**
 * Admin Store Catalog Service - Raw reads and write operations over the store
 * catalog tables (store categories, store sub categories and their
 * translations) for the platform admin panel.
 *
 * Reads return rows exactly as stored (all translations, inactive included).
 * Writes are bulk upserts designed for XLSX imports; a single-row array is the
 * row-by-row edit path of the admin panel. Rows are processed independently so
 * one bad spreadsheet line never aborts the whole import.
 */
@Injectable()
export class AdminCatalogService {
  private readonly logger = new Logger(AdminCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Raw reads ──────────────────────────────────────────────────────────────

  async getRawStoreCategories({
    adminId,
    id,
    page,
    pageSize,
    search,
  }: {
    adminId?: string;
    id?: number;
    page: number;
    pageSize: number;
    search?: string;
  }) {
    this.requireAdmin(adminId);
    const { skip, take } = calculatePrismaParams(page, pageSize);

    const where: Prisma.StoreCategoryWhereInput = {
      ...(id != null && { id }),
      ...(search?.trim() && {
        translations: {
          some: { name: { contains: search.trim(), mode: 'insensitive' } },
        },
      }),
    };

    const [count, rows] = await Promise.all([
      this.prisma.storeCategory.count({ where }),
      this.prisma.storeCategory.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take,
        include: { translations: { orderBy: { language: 'asc' } } },
      }),
    ]);

    return createPaginatedResponse(rows, count, page, pageSize);
  }

  async getRawStoreSubCategories({
    adminId,
    id,
    page,
    pageSize,
    search,
    storeCategoryId,
  }: {
    adminId?: string;
    id?: number;
    page: number;
    pageSize: number;
    search?: string;
    storeCategoryId?: number;
  }) {
    this.requireAdmin(adminId);
    const { skip, take } = calculatePrismaParams(page, pageSize);

    const where: Prisma.StoreSubCategoryWhereInput = {
      ...(id != null && { id }),
      ...(storeCategoryId != null && { storeCategoryId }),
      ...(search?.trim() && {
        translations: {
          some: { name: { contains: search.trim(), mode: 'insensitive' } },
        },
      }),
    };

    const [count, rows] = await Promise.all([
      this.prisma.storeSubCategory.count({ where }),
      this.prisma.storeSubCategory.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take,
        include: { translations: { orderBy: { language: 'asc' } } },
      }),
    ]);

    return createPaginatedResponse(rows, count, page, pageSize);
  }

  // ─── Bulk upserts ───────────────────────────────────────────────────────────

  async bulkUpsertStoreCategories({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: StoreCategoryUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        isActive: row.isActive,
        sortOrder: row.sortOrder,
        featuredFrom: row.featuredFrom,
        featuredUntil: row.featuredUntil,
      });

      if (row.id != null) {
        await this.prisma.storeCategory.update({ where: { id: row.id }, data });
        return { outcome: 'updated', id: row.id };
      }

      const created = await this.prisma.storeCategory.create({ data });
      return { outcome: 'created', id: created.id };
    });
  }

  async bulkUpsertStoreCategoryTranslations({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: StoreCategoryTranslationUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        storeCategoryId: row.storeCategoryId,
        language: row.language,
        name: row.name,
        slug: row.slug,
        href: row.href,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        metaKeywords: row.metaKeywords,
      });

      if (row.id != null) {
        await this.prisma.storeCategoryTranslation.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      const { storeCategoryId, language } = row;
      if (storeCategoryId == null || !language) {
        throw new BadRequestException(
          'storeCategoryId and language are required when no id is provided',
        );
      }

      const existing = await this.prisma.storeCategoryTranslation.findUnique({
        where: { storeCategoryId_language: { storeCategoryId, language } },
        select: { id: true },
      });

      if (existing) {
        await this.prisma.storeCategoryTranslation.update({
          where: { id: existing.id },
          data,
        });
        return { outcome: 'updated', id: existing.id };
      }

      this.requireFields(row, ['name', 'slug']);
      const created = await this.prisma.storeCategoryTranslation.create({
        data: {
          storeCategoryId,
          language,
          name: row.name!,
          slug: row.slug!,
          href: row.href,
          metaTitle: row.metaTitle,
          metaDescription: row.metaDescription,
          metaKeywords: row.metaKeywords ?? [],
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  async bulkUpsertStoreSubCategories({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: StoreSubCategoryUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        storeCategoryId: row.storeCategoryId,
        averageWeight: row.averageWeight,
        size: row.size,
        weightUnit: row.weightUnit,
        isActive: row.isActive,
        sortOrder: row.sortOrder,
        featuredFrom: row.featuredFrom,
        featuredUntil: row.featuredUntil,
      });

      if (row.id != null) {
        await this.prisma.storeSubCategory.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      if (row.storeCategoryId == null) {
        throw new BadRequestException(
          'storeCategoryId is required when no id is provided',
        );
      }

      const created = await this.prisma.storeSubCategory.create({
        data: { ...data, storeCategoryId: row.storeCategoryId },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  async bulkUpsertStoreSubCategoryTranslations({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: StoreSubCategoryTranslationUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        storeSubCategoryId: row.storeSubCategoryId,
        language: row.language,
        name: row.name,
        slug: row.slug,
        keywords: row.keywords,
        href: row.href,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
      });

      if (row.id != null) {
        await this.prisma.storeSubCategoryTranslation.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      const { storeSubCategoryId, language } = row;
      if (storeSubCategoryId == null || !language) {
        throw new BadRequestException(
          'storeSubCategoryId and language are required when no id is provided',
        );
      }

      const existing = await this.prisma.storeSubCategoryTranslation.findUnique(
        {
          where: {
            storeSubCategoryId_language: { storeSubCategoryId, language },
          },
          select: { id: true },
        },
      );

      if (existing) {
        await this.prisma.storeSubCategoryTranslation.update({
          where: { id: existing.id },
          data,
        });
        return { outcome: 'updated', id: existing.id };
      }

      this.requireFields(row, ['name', 'slug']);
      const created = await this.prisma.storeSubCategoryTranslation.create({
        data: {
          storeSubCategoryId,
          language,
          name: row.name!,
          slug: row.slug!,
          keywords: row.keywords ?? [],
          href: row.href,
          metaTitle: row.metaTitle,
          metaDescription: row.metaDescription,
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  // ─── Deletes ────────────────────────────────────────────────────────────────

  async deleteStoreCategory({ adminId, id }: { adminId?: string; id: number }) {
    this.requireAdmin(adminId);
    try {
      // Own translations cascade; a sub category that still has products
      // restricts the delete.
      await this.prisma.storeCategory.delete({ where: { id } });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  async deleteStoreCategoryTranslation({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      await this.prisma.storeCategoryTranslation.delete({ where: { id } });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  async deleteStoreSubCategory({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      // Translations cascade; store products restrict.
      await this.prisma.storeSubCategory.delete({ where: { id } });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  async deleteStoreSubCategoryTranslation({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      await this.prisma.storeSubCategoryTranslation.delete({ where: { id } });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private requireAdmin(adminId?: string): void {
    if (!adminId) {
      throw new UnauthorizedException('Admin authentication required');
    }
  }

  /** Throws when any of the listed fields is missing on a create row. */
  private requireFields<T extends object>(row: T, fields: (keyof T)[]): void {
    const missing = fields.filter(
      (f) => row[f] == null || row[f] === '',
    ) as string[];
    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required field(s) for create: ${missing.join(', ')}`,
      );
    }
  }

  /**
   * Keeps only the keys that were actually provided so an update never
   * overwrites columns the row didn't mention. Explicit null passes through
   * to clear nullable columns.
   */
  private pickDefined<T extends Record<string, unknown>>(obj: T): T {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined),
    ) as T;
  }

  /**
   * Runs the handler per row, tallying outcomes. A row failure is recorded
   * with its 0-based index (and id when present) instead of aborting the batch.
   */
  private async processRows<T extends { id?: number | null }>(
    rows: T[],
    handler: (row: T) => Promise<BulkOutcome>,
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
        const { outcome, id } = await handler(row);
        result[outcome] += 1;
        if (outcome === 'created') result.createdIds.push(id);
      } catch (error) {
        result.failed += 1;
        result.errors.push({
          index,
          id: row.id ?? null,
          message: this.errorMessage(error),
        });
      }
    }

    if (result.failed > 0) {
      this.logger.warn(
        `Bulk upsert finished with ${result.failed} failed row(s): ` +
          result.errors
            .map(
              (e) => `#${e.index}${e.id ? ` (id ${e.id})` : ''}: ${e.message}`,
            )
            .join(' | '),
      );
    }

    return result;
  }

  /** Translates Prisma error codes into messages an admin can act on. */
  private errorMessage(error: unknown): string {
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

  private friendlyError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return new BadRequestException(this.errorMessage(error));
    }
    return error instanceof Error ? error : new Error('Unknown error');
  }
}
