import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { Badge, WeightUnit, DimensionUnit } from '@prisma/client';
import { PageInfoEntity } from '../../products/entities/page-info.entity';

/**
 * Raw, admin-only view of a store product.
 *
 * Unlike the web-facing `StoreProduct` entity, this returns rows exactly as
 * stored — **including inactive and soft-deleted products** (the admin read
 * bypasses the `isActive: true` / `deletedAt: null` web filter) — so the admin
 * panel can list, correct and export the whole catalog. Named `RawStoreProduct`
 * to stay distinct from the federated `StoreProduct` entity. Engagement metrics
 * and `deletedAt` are read-only (not part of the bulk-upsert input).
 */
@ObjectType('RawStoreProduct')
export class RawStoreProductEntity {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  description: string;

  @Field(() => Int)
  stock: number;

  @Field(() => String, { nullable: true })
  barcode?: string | null;

  @Field(() => String, { nullable: true })
  sku?: string | null;

  @Field(() => Int)
  price: number;

  @Field(() => Boolean)
  hasOffer: boolean;

  @Field(() => Int, { nullable: true })
  offerPrice?: number | null;

  @Field(() => String)
  sellerId: string;

  @Field(() => [String])
  images: string[];

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => [Badge])
  badges: Badge[];

  @Field(() => String, { nullable: true })
  brand?: string | null;

  @Field(() => String, { nullable: true })
  color?: string | null;

  // Metrics & engagement (read-only)
  @Field(() => Float)
  averageRating: number;

  @Field(() => Int)
  reviewsNumber: number;

  @Field(() => Int)
  likesCount: number;

  @Field(() => Int)
  saleCount: number;

  @Field(() => Int)
  viewCount: number;

  // Specifications
  @Field(() => String, { nullable: true })
  materialComposition?: string | null;

  @Field(() => Float, { nullable: true })
  recycledContent?: number | null;

  @Field(() => Float, { nullable: true })
  weight?: number | null;

  @Field(() => WeightUnit, { nullable: true })
  weightUnit?: WeightUnit | null;

  @Field(() => Float, { nullable: true })
  length?: number | null;

  @Field(() => Float, { nullable: true })
  width?: number | null;

  @Field(() => Float, { nullable: true })
  height?: number | null;

  @Field(() => DimensionUnit, { nullable: true })
  dimensionUnit?: DimensionUnit | null;

  // Inventory
  @Field(() => Int, { nullable: true })
  lowStockThreshold?: number | null;

  @Field(() => Boolean)
  isLowStock: boolean;

  // SEO & search
  @Field(() => [String])
  tags: string[];

  @Field(() => String, { nullable: true })
  metaTitle?: string | null;

  @Field(() => String, { nullable: true })
  metaDescription?: string | null;

  // Additional
  @Field(() => Boolean, { nullable: true })
  warranty?: boolean | null;

  @Field(() => Int, { nullable: true })
  warrantyDuration?: number | null;

  @Field(() => [String])
  features: string[];

  @Field(() => Int)
  subCategoryId: number;

  @Field(() => Date, { nullable: true })
  featuredFrom?: Date | null;

  @Field(() => Date, { nullable: true })
  featuredUntil?: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Soft-delete timestamp (null = live). Read-only.',
  })
  deletedAt?: Date | null;
}

@ObjectType('RawStoreProductConnection')
export class RawStoreProductConnectionEntity {
  @Field(() => [RawStoreProductEntity])
  nodes: RawStoreProductEntity[];

  @Field(() => PageInfoEntity)
  pageInfo: PageInfoEntity;
}
