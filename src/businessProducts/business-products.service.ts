import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { businessAdminSellerId } from '../common/admin-access';
import { I18nService } from '../common/i18n';
import { pickDefined, processBulkRows, type BulkResult } from '../common/utils';
import { Language } from '../graphql/enums';
import { ProductsService } from '../products/products.service';
import type { BusinessStoreProductRowInput } from './dto';

/** One request carries at most this many rows; the panel sends them in chunks. */
export const MAX_ROWS_PER_CALL = 200;

/** Where EKORU's photos live; next/image on the web renders nothing else. */
const IMAGE_HOSTS = ['images.ekoru.cl', 'staging-images.ekoru.cl'];

const REQUIRED_ON_CREATE = [
  'name',
  'description',
  'price',
  'stock',
  'subCategoryId',
] as const;

/**
 * A business publishing its catalog from a spreadsheet in the panel (ADM-16),
 * the paid panel's main draw (USR-15). The same rules as publishing one
 * product on the web, applied per row:
 * - only an approved store that sells products (RETAIL or MIXED) publishes;
 * - every product declares its materials, adding up to 100;
 * - a row with an id updates that product only if it is the caller's;
 * - a product needs a photo to show: without one it is saved hidden, and the
 *   store adds the photo on the web ("Mis publicaciones") and turns it on.
 * Rows are written one at a time, so one bad line never stops the others.
 */
@Injectable()
export class BusinessProductsService {
  private readonly logger = new Logger(BusinessProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
    private readonly i18n: I18nService,
  ) {}

  async publishMyStoreProducts({
    adminId,
    rows,
    language,
  }: {
    adminId?: string;
    rows: BusinessStoreProductRowInput[];
    language?: Language;
  }): Promise<BulkResult> {
    const lang = language ?? this.i18n.getDefaultLanguage();
    const sellerId = await businessAdminSellerId(
      this.prisma,
      adminId,
      'MANAGE_BUSINESS_PRODUCTS',
    );
    if (rows.length > MAX_ROWS_PER_CALL) {
      throw new BadRequestException(
        this.i18n.translate('errors.bulk_too_many_rows', lang, {
          max: String(MAX_ROWS_PER_CALL),
        }),
      );
    }
    await this.products.assertCanPublish(sellerId, lang);

    // Subcategories named in the file, read once: a wrong id gets a clear row
    // error instead of an opaque foreign-key one.
    const named = [
      ...new Set(rows.map((r) => r.subCategoryId).filter((id) => id != null)),
    ] as number[];
    const known = new Set(
      (
        await this.prisma.storeSubCategory.findMany({
          where: { id: { in: named } },
          select: { id: true },
        })
      ).map((s) => s.id),
    );

    return processBulkRows(this.logger, rows, async (row) => {
      if (row.subCategoryId != null && !known.has(row.subCategoryId)) {
        throw new BadRequestException(
          this.i18n.translate('errors.bulk_subcategory_not_found', lang, {
            id: String(row.subCategoryId),
          }),
        );
      }
      if (row.images) this.assertEkoruImages(row.images, sellerId, lang);

      const { id, materials } = row;
      // Named one by one: the seller, metrics and featured dates never come
      // from a row, whatever reaches this method.
      const fields = pickDefined({
        name: row.name,
        description: row.description,
        price: row.price,
        stock: row.stock,
        subCategoryId: row.subCategoryId,
        hasOffer: row.hasOffer,
        offerPrice: row.offerPrice,
        images: row.images,
        isActive: row.isActive,
        badges: row.badges,
        brand: row.brand,
        color: row.color,
        sku: row.sku,
        barcode: row.barcode,
        recycledContent: row.recycledContent,
        weight: row.weight,
        weightUnit: row.weightUnit,
        size: row.size,
        length: row.length,
        width: row.width,
        height: row.height,
        dimensionUnit: row.dimensionUnit,
        tags: row.tags,
        features: row.features,
        warranty: row.warranty,
        warrantyDuration: row.warrantyDuration,
      });
      const data = { ...fields, updatedAt: new Date() };

      if (id != null) {
        const existing = await this.prisma.storeProduct.findUnique({
          where: { id },
          select: {
            sellerId: true,
            deletedAt: true,
            images: true,
            price: true,
            hasOffer: true,
            offerPrice: true,
          },
        });
        if (!existing || existing.sellerId !== sellerId) {
          throw new BadRequestException(
            this.i18n.translate('errors.bulk_not_in_store', lang, {
              id: String(id),
            }),
          );
        }
        if (existing.deletedAt) {
          throw new BadRequestException(
            this.i18n.translate('errors.bulk_product_deleted', lang, {
              id: String(id),
            }),
          );
        }
        this.assertOffer({ ...existing, ...fields }, lang);
        if (materials) {
          await this.products.assertValidComposition(materials, lang);
        }
        const images = row.images ?? existing.images;
        await this.prisma.storeProduct.update({
          where: { id },
          data: {
            ...data,
            ...(row.isActive === true &&
              images.length === 0 && {
                isActive: false,
              }),
            ...(materials && {
              materialCompositions: {
                deleteMany: {},
                create: materials.map((m) => ({
                  materialTypeId: m.materialTypeId,
                  percentage: m.percentage,
                })),
              },
            }),
          },
        });
        return { outcome: 'updated', id };
      }

      const missing = REQUIRED_ON_CREATE.filter(
        (f) => row[f] == null || row[f] === '',
      );
      if (missing.length) {
        throw new BadRequestException(
          this.i18n.translate('errors.bulk_missing_fields', lang, {
            fields: missing.join(', '),
          }),
        );
      }
      this.assertOffer(row, lang);
      await this.products.assertValidComposition(materials, lang);

      const images = row.images ?? [];
      const created = await this.prisma.storeProduct.create({
        data: {
          ...data,
          name: row.name!,
          description: row.description!,
          price: row.price!,
          stock: row.stock!,
          subCategoryId: row.subCategoryId!,
          sellerId,
          images,
          isActive: images.length > 0 && (row.isActive ?? true),
          materialCompositions: {
            create: materials!.map((m) => ({
              materialTypeId: m.materialTypeId,
              percentage: m.percentage,
            })),
          },
        },
        select: { id: true },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  /** An offer needs a positive price below the regular one, as on the web. */
  private assertOffer(
    p: {
      hasOffer?: boolean | null;
      offerPrice?: number | null;
      price?: number | null;
    },
    lang: Language,
  ) {
    if (!p.hasOffer) return;
    if (!p.offerPrice || p.offerPrice <= 0 || p.offerPrice >= (p.price ?? 0)) {
      throw new BadRequestException(
        this.i18n.translate('errors.bulk_offer_price', lang),
      );
    }
  }

  /**
   * Photos must already be EKORU's: a key in the store's own upload folder, or
   * a URL on EKORU's image hosts (what the export writes back).
   */
  private assertEkoruImages(
    images: string[],
    sellerId: string,
    lang: Language,
  ) {
    const ours = (image: string) => {
      if (image.startsWith(`product/${sellerId}/`)) return true;
      try {
        const url = new URL(image);
        return url.protocol === 'https:' && IMAGE_HOSTS.includes(url.hostname);
      } catch {
        return false;
      }
    };
    if (!images.every(ours)) {
      throw new BadRequestException(
        this.i18n.translate('errors.bulk_image_host', lang, {
          hosts: IMAGE_HOSTS[0],
        }),
      );
    }
  }
}
