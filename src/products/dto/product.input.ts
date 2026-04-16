import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  IsPositive,
} from 'class-validator';
import { Badge, WeightUnit, DimensionUnit } from '@prisma/client';

/**
 * GraphQL Input for filtering store products
 */
@InputType('StoreProductFilterInput')
export class StoreProductFilterInput {
  @Field(() => String, {
    nullable: true,
    description: 'Filter by product name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => Int, { nullable: true, description: 'Minimum price filter' })
  @IsOptional()
  @IsInt()
  minPrice?: number;

  @Field(() => Int, { nullable: true, description: 'Maximum price filter' })
  @IsOptional()
  @IsInt()
  maxPrice?: number;

  @Field(() => String, { nullable: true, description: 'Filter by brand' })
  @IsOptional()
  @IsString()
  brand?: string;

  @Field(() => String, { nullable: true, description: 'Filter by color' })
  @IsOptional()
  @IsString()
  color?: string;

  @Field(() => [Badge], { nullable: true, description: 'Filter by badges' })
  @IsOptional()
  @IsArray()
  @IsEnum(Badge, { each: true })
  badges?: Badge[];

  @Field(() => Boolean, {
    nullable: true,
    description: 'Filter by offer status',
  })
  @IsOptional()
  @IsBoolean()
  hasOffer?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Filter by low stock status',
  })
  @IsOptional()
  @IsBoolean()
  isLowStock?: boolean;

  @Field(() => Int, {
    nullable: true,
    description: 'Filter by subcategory ID',
  })
  @IsOptional()
  @IsInt()
  subCategoryId?: number;

  @Field(() => [String], { nullable: true, description: 'Filter by tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field(() => Float, {
    nullable: true,
    description: 'Minimum average rating filter',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minRating?: number;
}

/**
 * GraphQL Input for sorting store products
 */
@InputType('StoreProductSortInput')
export class StoreProductSortInput {
  @Field(() => String, {
    description:
      'Field to sort by (e.g., price, createdAt, name, averageRating, saleCount, viewCount)',
  })
  @IsString()
  field: string;

  @Field(() => String, {
    nullable: true,
    description: 'Sort order: asc or desc',
    defaultValue: 'desc',
  })
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';
}

/**
 * GraphQL Input for adding a new store product
 */
@InputType('AddStoreProductInput')
export class AddStoreProductInput {
  @Field(() => String, { description: 'Product name' })
  @IsString()
  name: string;

  @Field(() => String, { description: 'Product description' })
  @IsString()
  description: string;

  @Field(() => Int, { description: 'Initial stock quantity' })
  @IsInt()
  @Min(0)
  stock: number;

  @Field(() => String, { nullable: true, description: 'Product barcode' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @Field(() => String, { nullable: true, description: 'Product SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @Field(() => Int, {
    description: 'Product price (in cents/lowest currency unit)',
  })
  @IsInt()
  @IsPositive()
  price: number;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether product has an offer',
    defaultValue: false,
  })
  @IsOptional()
  @IsBoolean()
  hasOffer?: boolean;

  @Field(() => Int, { nullable: true, description: 'Offer price' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  offerPrice?: number;

  @Field(() => [String], { description: 'Product image URLs' })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @Field(() => [Badge], {
    nullable: true,
    description: 'Product badges',
    defaultValue: [],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Badge, { each: true })
  badges?: Badge[];

  @Field(() => String, { nullable: true, description: 'Product brand' })
  @IsOptional()
  @IsString()
  brand?: string;

  @Field(() => String, { nullable: true, description: 'Product color' })
  @IsOptional()
  @IsString()
  color?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Material composition description',
  })
  @IsOptional()
  @IsString()
  materialComposition?: string;

  @Field(() => Float, {
    nullable: true,
    description: 'Percentage of recycled content',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  recycledContent?: number;

  @Field(() => Float, { nullable: true, description: 'Product weight' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number;

  @Field(() => WeightUnit, {
    nullable: true,
    description: 'Weight unit',
    defaultValue: WeightUnit.KG,
  })
  @IsOptional()
  @IsEnum(WeightUnit)
  weightUnit?: WeightUnit;

  @Field(() => Float, { nullable: true, description: 'Product length' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  length?: number;

  @Field(() => Float, { nullable: true, description: 'Product width' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  width?: number;

  @Field(() => Float, { nullable: true, description: 'Product height' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  height?: number;

  @Field(() => DimensionUnit, {
    nullable: true,
    description: 'Dimension unit',
    defaultValue: DimensionUnit.CM,
  })
  @IsOptional()
  @IsEnum(DimensionUnit)
  dimensionUnit?: DimensionUnit;

  @Field(() => Int, {
    nullable: true,
    description: 'Low stock threshold',
    defaultValue: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @Field(() => [String], {
    nullable: true,
    description: 'Product search tags',
    defaultValue: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field(() => String, { nullable: true, description: 'SEO meta title' })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @Field(() => String, { nullable: true, description: 'SEO meta description' })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @Field(() => String, { nullable: true, description: 'Warranty information' })
  @IsOptional()
  @IsString()
  warranty?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Warranty duration in months',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  warrantyDuration?: number;

  @Field(() => [String], {
    nullable: true,
    description: 'Product features list',
    defaultValue: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @Field(() => Int, { description: 'Store subcategory ID' })
  @IsInt()
  subCategoryId: number;
}

/**
 * GraphQL Input for updating an existing store product
 */
@InputType('UpdateStoreProductInput')
export class UpdateStoreProductInput {
  @Field(() => Int, { description: 'Product ID to update' })
  @IsInt()
  id: number;

  @Field(() => String, { nullable: true, description: 'Product name' })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true, description: 'Product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Int, { nullable: true, description: 'Stock quantity' })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @Field(() => String, { nullable: true, description: 'Product barcode' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @Field(() => String, { nullable: true, description: 'Product SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @Field(() => Int, { nullable: true, description: 'Product price' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  price?: number;

  @Field(() => Boolean, { nullable: true, description: 'Has offer status' })
  @IsOptional()
  @IsBoolean()
  hasOffer?: boolean;

  @Field(() => Int, { nullable: true, description: 'Offer price' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  offerPrice?: number;

  @Field(() => [String], { nullable: true, description: 'Product image URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @Field(() => Boolean, { nullable: true, description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => [Badge], { nullable: true, description: 'Product badges' })
  @IsOptional()
  @IsArray()
  @IsEnum(Badge, { each: true })
  badges?: Badge[];

  @Field(() => String, { nullable: true, description: 'Product brand' })
  @IsOptional()
  @IsString()
  brand?: string;

  @Field(() => String, { nullable: true, description: 'Product color' })
  @IsOptional()
  @IsString()
  color?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Material composition description',
  })
  @IsOptional()
  @IsString()
  materialComposition?: string;

  @Field(() => Float, {
    nullable: true,
    description: 'Percentage of recycled content',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  recycledContent?: number;

  @Field(() => Float, { nullable: true, description: 'Product weight' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number;

  @Field(() => WeightUnit, { nullable: true, description: 'Weight unit' })
  @IsOptional()
  @IsEnum(WeightUnit)
  weightUnit?: WeightUnit;

  @Field(() => Float, { nullable: true, description: 'Product length' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  length?: number;

  @Field(() => Float, { nullable: true, description: 'Product width' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  width?: number;

  @Field(() => Float, { nullable: true, description: 'Product height' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  height?: number;

  @Field(() => DimensionUnit, {
    nullable: true,
    description: 'Dimension unit',
  })
  @IsOptional()
  @IsEnum(DimensionUnit)
  dimensionUnit?: DimensionUnit;

  @Field(() => Int, {
    nullable: true,
    description: 'Low stock threshold',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @Field(() => [String], {
    nullable: true,
    description: 'Product search tags',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field(() => String, { nullable: true, description: 'SEO meta title' })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @Field(() => String, { nullable: true, description: 'SEO meta description' })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @Field(() => String, { nullable: true, description: 'Warranty information' })
  @IsOptional()
  @IsString()
  warranty?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Warranty duration in months',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  warrantyDuration?: number;

  @Field(() => [String], {
    nullable: true,
    description: 'Product features list',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @Field(() => Int, { nullable: true, description: 'Store subcategory ID' })
  @IsOptional()
  @IsInt()
  subCategoryId?: number;
}
