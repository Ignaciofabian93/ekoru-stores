import { ArgsType, Field, InputType, Int, Float } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Badge, WeightUnit, DimensionUnit } from '../../graphql/enums';

/**
 * Admin store-product inputs.
 *
 * The bulk upsert follows the shared catalog contract:
 * - `id` present → update that row (only the provided fields change)
 * - no `id`      → create (name/description/price/sellerId/subCategoryId required)
 *
 * Omitted fields are left untouched on update; explicit `null` clears a
 * nullable column. Engagement metrics, timestamps and `deletedAt` are not
 * editable here (metrics are denormalized; deletes go through the mutation).
 */

@ArgsType()
export class RawStoreProductListArgs {
  @Field(() => Int, {
    nullable: true,
    description: 'Fetch a single row by id (edit screen)',
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => Int, { defaultValue: 1, description: 'Page number (1-based)' })
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 50, description: 'Items per page' })
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize: number;

  @Field(() => String, {
    nullable: true,
    description: 'Filters products whose name contains this text',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => Int, { nullable: true, description: 'Filter by sub category' })
  @IsOptional()
  @IsInt()
  subCategoryId?: number;

  @Field(() => String, { nullable: true, description: 'Filter by seller' })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @Field(() => Boolean, {
    nullable: true,
    description:
      'true → only soft-deleted; false → only live; omitted → all (default)',
  })
  @IsOptional()
  @IsBoolean()
  deleted?: boolean;
}

@InputType()
export class StoreProductUpsertRowInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  stock?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  barcode?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  sku?: string | null;

  @Field(() => Int, { nullable: true, description: 'Price (integer units)' })
  @IsOptional()
  @IsInt()
  price?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  hasOffer?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  offerPrice?: number | null;

  @Field(() => String, {
    nullable: true,
    description: 'Owner seller. Required when creating (no id).',
  })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  images?: string[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => [Badge], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(Badge, { each: true })
  badges?: Badge[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  brand?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  color?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  materialComposition?: string | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  recycledContent?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  weight?: number | null;

  @Field(() => WeightUnit, { nullable: true })
  @IsOptional()
  @IsEnum(WeightUnit)
  weightUnit?: WeightUnit | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  length?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  width?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  height?: number | null;

  @Field(() => DimensionUnit, { nullable: true })
  @IsOptional()
  @IsEnum(DimensionUnit)
  dimensionUnit?: DimensionUnit | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  lowStockThreshold?: number | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isLowStock?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  metaTitle?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metaDescription?: string | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  warranty?: boolean | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  warrantyDuration?: number | null;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  features?: string[];

  @Field(() => Int, {
    nullable: true,
    description:
      'Parent sub category. Required when creating; on update it re-parents.',
  })
  @IsOptional()
  @IsInt()
  subCategoryId?: number;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  featuredFrom?: Date | null;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  featuredUntil?: Date | null;
}
