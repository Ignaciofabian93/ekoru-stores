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
  StoreProductUpsertRowInput,
  StoreProductMaterialUpsertRowInput,
  ProductVariantUpsertRowInput,
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
 * Admin Store Product Service — raw reads and bulk writes over the StoreProduct
 * table for the platform admin panel.
 *
 * Reads bypass the web `isActive: true` / `deletedAt: null` filter so the admin
 * sees the whole catalog (inactive and soft-deleted included). Writes are bulk
 * upserts of the flat product columns, shared by the XLSX import and the
 * row-by-row edit form; engagement metrics are read-only. Rows are processed
 * independently so one bad line never aborts the batch.
 */
@Injectable()
export class AdminStoreProductService {
  private readonly logger = new Logger(AdminStoreProductService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRawStoreProducts({
    adminId,
    id,
    page,
    pageSize,
    search,
    subCategoryId,
    sellerId,
    deleted,
  }: {
    adminId?: string;
    id?: number;
    page: number;
    pageSize: number;
    search?: string;
    subCategoryId?: number;
    sellerId?: string;
    deleted?: boolean;
  }) {
    this.requireAdmin(adminId);
    const { skip, take } = calculatePrismaParams(page, pageSize);

    const where: Prisma.StoreProductWhereInput = {
      ...(id != null && { id }),
      ...(subCategoryId != null && { subCategoryId }),
      ...(sellerId && { sellerId }),
      // deleted omitted → all rows; true → only soft-deleted; false → only live.
      ...(deleted === true && { deletedAt: { not: null } }),
      ...(deleted === false && { deletedAt: null }),
      ...(search?.trim() && {
        name: { contains: search.trim(), mode: 'insensitive' },
      }),
    };

    const [count, rows] = await Promise.all([
      this.prisma.storeProduct.count({ where }),
      this.prisma.storeProduct.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take,
        include: {
          materialCompositions: {
            orderBy: { id: 'asc' },
            include: { material: { select: { materialType: true } } },
          },
          productVariant: { orderBy: { id: 'asc' } },
        },
      }),
    ]);

    const nodes = rows.map(
      ({ materialCompositions, productVariant, ...row }) => ({
        ...row,
        materials: materialCompositions.map(({ material, ...m }) => ({
          ...m,
          materialType: material?.materialType ?? null,
        })),
        variants: productVariant,
      }),
    );

    return createPaginatedResponse(nodes, count, page, pageSize);
  }

  async bulkUpsertStoreProducts({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: StoreProductUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        name: row.name,
        description: row.description,
        stock: row.stock,
        barcode: row.barcode,
        sku: row.sku,
        price: row.price,
        hasOffer: row.hasOffer,
        offerPrice: row.offerPrice,
        sellerId: row.sellerId,
        images: row.images,
        isActive: row.isActive,
        badges: row.badges,
        brand: row.brand,
        color: row.color,
        materialComposition: row.materialComposition,
        recycledContent: row.recycledContent,
        weight: row.weight,
        weightUnit: row.weightUnit,
        length: row.length,
        width: row.width,
        height: row.height,
        dimensionUnit: row.dimensionUnit,
        lowStockThreshold: row.lowStockThreshold,
        isLowStock: row.isLowStock,
        tags: row.tags,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        warranty: row.warranty,
        warrantyDuration: row.warrantyDuration,
        features: row.features,
        subCategoryId: row.subCategoryId,
        featuredFrom: row.featuredFrom,
        featuredUntil: row.featuredUntil,
      });

      if (row.id != null) {
        await this.prisma.storeProduct.update({ where: { id: row.id }, data });
        return { outcome: 'updated', id: row.id };
      }

      this.requireFields(row, [
        'name',
        'description',
        'price',
        'sellerId',
        'subCategoryId',
      ]);
      const created = await this.prisma.storeProduct.create({
        data: {
          ...data,
          name: row.name!,
          description: row.description!,
          price: row.price!,
          sellerId: row.sellerId!,
          subCategoryId: row.subCategoryId!,
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  async deleteStoreProduct({ adminId, id }: { adminId?: string; id: number }) {
    this.requireAdmin(adminId);
    try {
      // Hard delete. Fails (P2003) while order items or other rows still
      // reference the product — the seller's soft delete (deletedAt) is the
      // safe path for those, reachable by setting isActive false via upsert.
      await this.prisma.storeProduct.delete({ where: { id } });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  // ─── Material composition ─────────────────────────────────────────────────────

  async bulkUpsertStoreProductMaterials({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: StoreProductMaterialUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        storeProductId: row.storeProductId,
        materialTypeId: row.materialTypeId,
        percentage: row.percentage,
      });

      if (row.id != null) {
        await this.prisma.storeProductMaterialComposition.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      // No id: (storeProductId, materialTypeId) is unique — match on it.
      if (row.storeProductId != null && row.materialTypeId != null) {
        const existing =
          await this.prisma.storeProductMaterialComposition.findUnique({
            where: {
              storeProductId_materialTypeId: {
                storeProductId: row.storeProductId,
                materialTypeId: row.materialTypeId,
              },
            },
            select: { id: true },
          });
        if (existing) {
          await this.prisma.storeProductMaterialComposition.update({
            where: { id: existing.id },
            data,
          });
          return { outcome: 'updated', id: existing.id };
        }
      }

      this.requireFields(row, [
        'storeProductId',
        'materialTypeId',
        'percentage',
      ]);
      const created = await this.prisma.storeProductMaterialComposition.create({
        data: {
          storeProductId: row.storeProductId!,
          materialTypeId: row.materialTypeId!,
          percentage: row.percentage!,
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  async deleteStoreProductMaterial({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      await this.prisma.storeProductMaterialComposition.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  // ─── Variants ─────────────────────────────────────────────────────────────────

  async bulkUpsertProductVariants({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: ProductVariantUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        storeProductId: row.storeProductId,
        name: row.name,
        price: row.price,
        stock: row.stock,
        color: row.color,
        size: row.size,
      });

      if (row.id != null) {
        await this.prisma.productVariant.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      this.requireFields(row, [
        'storeProductId',
        'name',
        'price',
        'stock',
        'size',
      ]);
      const created = await this.prisma.productVariant.create({
        data: {
          storeProductId: row.storeProductId!,
          name: row.name!,
          price: row.price!,
          stock: row.stock!,
          color: row.color,
          size: row.size!,
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  async deleteProductVariant({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      await this.prisma.productVariant.delete({ where: { id } });
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

  private pickDefined<T extends Record<string, unknown>>(obj: T): T {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined),
    ) as T;
  }

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
