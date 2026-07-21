import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { ProductSize, WeightUnit } from '@prisma/client';
import { PageInfoEntity } from '../../products/entities/page-info.entity';
import { StoreCategoryTranslationEntity } from '../../storeCategories/entities';
import { StoreSubCategoryTranslationEntity } from '../../storeSubCategories/entities';

/**
 * Raw, admin-only views of the store catalog tables.
 *
 * Unlike the web-facing entities, these return each row exactly as stored —
 * every translation, no active-language filtering, including inactive rows —
 * so the admin panel can drive CRUD screens and XLSX export/import directly.
 */

@ObjectType('RawStoreCategory')
export class RawStoreCategoryEntity {
  @Field(() => Int)
  id: number;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Int)
  sortOrder: number;

  @Field(() => Date, { nullable: true })
  featuredFrom?: Date | null;

  @Field(() => Date, { nullable: true })
  featuredUntil?: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [StoreCategoryTranslationEntity])
  translations: StoreCategoryTranslationEntity[];
}

@ObjectType('RawStoreSubCategory')
export class RawStoreSubCategoryEntity {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  storeCategoryId: number;

  @Field(() => Float, { nullable: true })
  averageWeight?: number | null;

  @Field(() => ProductSize, { nullable: true })
  size?: ProductSize | null;

  @Field(() => WeightUnit, { nullable: true })
  weightUnit?: WeightUnit | null;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Int)
  sortOrder: number;

  @Field(() => Date, { nullable: true })
  featuredFrom?: Date | null;

  @Field(() => Date, { nullable: true })
  featuredUntil?: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [StoreSubCategoryTranslationEntity])
  translations: StoreSubCategoryTranslationEntity[];
}

@ObjectType('RawStoreCategoryConnection')
export class RawStoreCategoryConnectionEntity {
  @Field(() => [RawStoreCategoryEntity])
  nodes: RawStoreCategoryEntity[];

  @Field(() => PageInfoEntity)
  pageInfo: PageInfoEntity;
}

@ObjectType('RawStoreSubCategoryConnection')
export class RawStoreSubCategoryConnectionEntity {
  @Field(() => [RawStoreSubCategoryEntity])
  nodes: RawStoreSubCategoryEntity[];

  @Field(() => PageInfoEntity)
  pageInfo: PageInfoEntity;
}

/**
 * Per-row failure inside a bulk upsert. `index` is the 0-based position of the
 * offending row in the submitted array so the admin panel can point at the
 * exact spreadsheet line.
 */
@ObjectType('StoreBulkRowError')
export class BulkRowErrorEntity {
  @Field(() => Int)
  index: number;

  @Field(() => Int, { nullable: true })
  id?: number | null;

  @Field(() => String)
  message: string;
}

/**
 * Outcome of a bulk upsert. Rows are processed independently: one bad row is
 * reported in `errors` without aborting the rest of the batch.
 */
@ObjectType('StoreBulkUpsertResult')
export class BulkUpsertResultEntity {
  @Field(() => Int)
  created: number;

  @Field(() => [Int], {
    description: 'ids of the rows created by this batch, in submission order',
  })
  createdIds: number[];

  @Field(() => Int)
  updated: number;

  @Field(() => Int)
  failed: number;

  @Field(() => [BulkRowErrorEntity])
  errors: BulkRowErrorEntity[];
}
