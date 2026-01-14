import { InputType, Field, Int, Float } from '@nestjs/graphql';
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
  name?: string;

  @Field(() => Int, { nullable: true, description: 'Minimum price filter' })
  minPrice?: number;

  @Field(() => Int, { nullable: true, description: 'Maximum price filter' })
  maxPrice?: number;

  @Field(() => String, { nullable: true, description: 'Filter by brand' })
  brand?: string;

  @Field(() => String, { nullable: true, description: 'Filter by color' })
  color?: string;

  @Field(() => [Badge], { nullable: true, description: 'Filter by badges' })
  badges?: Badge[];

  @Field(() => Boolean, {
    nullable: true,
    description: 'Filter by offer status',
  })
  hasOffer?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Filter by low stock status',
  })
  isLowStock?: boolean;

  @Field(() => Int, {
    nullable: true,
    description: 'Filter by subcategory ID',
  })
  subCategoryId?: number;

  @Field(() => [String], { nullable: true, description: 'Filter by tags' })
  tags?: string[];

  @Field(() => Float, {
    nullable: true,
    description: 'Minimum average rating filter',
  })
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
  field: string;

  @Field(() => String, {
    nullable: true,
    description: 'Sort order: asc or desc',
    defaultValue: 'desc',
  })
  order?: 'asc' | 'desc';
}

/**
 * GraphQL Input for adding a new store product
 */
@InputType('AddStoreProductInput')
export class AddStoreProductInput {
  @Field(() => String, { description: 'Product name' })
  name: string;

  @Field(() => String, { description: 'Product description' })
  description: string;

  @Field(() => Int, { description: 'Initial stock quantity' })
  stock: number;

  @Field(() => String, { nullable: true, description: 'Product barcode' })
  barcode?: string;

  @Field(() => String, { nullable: true, description: 'Product SKU' })
  sku?: string;

  @Field(() => Int, {
    description: 'Product price (in cents/lowest currency unit)',
  })
  price: number;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether product has an offer',
    defaultValue: false,
  })
  hasOffer?: boolean;

  @Field(() => Int, { nullable: true, description: 'Offer price' })
  offerPrice?: number;

  @Field(() => [String], { description: 'Product image URLs' })
  images: string[];

  @Field(() => [Badge], {
    nullable: true,
    description: 'Product badges',
    defaultValue: [],
  })
  badges?: Badge[];

  @Field(() => String, { nullable: true, description: 'Product brand' })
  brand?: string;

  @Field(() => String, { nullable: true, description: 'Product color' })
  color?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Material composition description',
  })
  materialComposition?: string;

  @Field(() => Float, {
    nullable: true,
    description: 'Percentage of recycled content',
  })
  recycledContent?: number;

  @Field(() => Float, { nullable: true, description: 'Product weight' })
  weight?: number;

  @Field(() => WeightUnit, {
    nullable: true,
    description: 'Weight unit',
    defaultValue: WeightUnit.KG,
  })
  weightUnit?: WeightUnit;

  @Field(() => Float, { nullable: true, description: 'Product length' })
  length?: number;

  @Field(() => Float, { nullable: true, description: 'Product width' })
  width?: number;

  @Field(() => Float, { nullable: true, description: 'Product height' })
  height?: number;

  @Field(() => DimensionUnit, {
    nullable: true,
    description: 'Dimension unit',
    defaultValue: DimensionUnit.CM,
  })
  dimensionUnit?: DimensionUnit;

  @Field(() => Int, {
    nullable: true,
    description: 'Low stock threshold',
    defaultValue: 5,
  })
  lowStockThreshold?: number;

  @Field(() => [String], {
    nullable: true,
    description: 'Product search tags',
    defaultValue: [],
  })
  tags?: string[];

  @Field(() => String, { nullable: true, description: 'SEO meta title' })
  metaTitle?: string;

  @Field(() => String, { nullable: true, description: 'SEO meta description' })
  metaDescription?: string;

  @Field(() => String, { nullable: true, description: 'Warranty information' })
  warranty?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Warranty duration in months',
  })
  warrantyDuration?: number;

  @Field(() => [String], {
    nullable: true,
    description: 'Product features list',
    defaultValue: [],
  })
  features?: string[];

  @Field(() => Int, { description: 'Store subcategory ID' })
  subCategoryId: number;
}

/**
 * GraphQL Input for updating an existing store product
 */
@InputType('UpdateStoreProductInput')
export class UpdateStoreProductInput {
  @Field(() => Int, { description: 'Product ID to update' })
  id: number;

  @Field(() => String, { nullable: true, description: 'Product name' })
  name?: string;

  @Field(() => String, { nullable: true, description: 'Product description' })
  description?: string;

  @Field(() => Int, { nullable: true, description: 'Stock quantity' })
  stock?: number;

  @Field(() => String, { nullable: true, description: 'Product barcode' })
  barcode?: string;

  @Field(() => String, { nullable: true, description: 'Product SKU' })
  sku?: string;

  @Field(() => Int, { nullable: true, description: 'Product price' })
  price?: number;

  @Field(() => Boolean, { nullable: true, description: 'Has offer status' })
  hasOffer?: boolean;

  @Field(() => Int, { nullable: true, description: 'Offer price' })
  offerPrice?: number;

  @Field(() => [String], { nullable: true, description: 'Product image URLs' })
  images?: string[];

  @Field(() => Boolean, { nullable: true, description: 'Active status' })
  isActive?: boolean;

  @Field(() => [Badge], { nullable: true, description: 'Product badges' })
  badges?: Badge[];

  @Field(() => String, { nullable: true, description: 'Product brand' })
  brand?: string;

  @Field(() => String, { nullable: true, description: 'Product color' })
  color?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Material composition description',
  })
  materialComposition?: string;

  @Field(() => Float, {
    nullable: true,
    description: 'Percentage of recycled content',
  })
  recycledContent?: number;

  @Field(() => Float, { nullable: true, description: 'Product weight' })
  weight?: number;

  @Field(() => WeightUnit, { nullable: true, description: 'Weight unit' })
  weightUnit?: WeightUnit;

  @Field(() => Float, { nullable: true, description: 'Product length' })
  length?: number;

  @Field(() => Float, { nullable: true, description: 'Product width' })
  width?: number;

  @Field(() => Float, { nullable: true, description: 'Product height' })
  height?: number;

  @Field(() => DimensionUnit, {
    nullable: true,
    description: 'Dimension unit',
  })
  dimensionUnit?: DimensionUnit;

  @Field(() => Int, {
    nullable: true,
    description: 'Low stock threshold',
  })
  lowStockThreshold?: number;

  @Field(() => [String], {
    nullable: true,
    description: 'Product search tags',
  })
  tags?: string[];

  @Field(() => String, { nullable: true, description: 'SEO meta title' })
  metaTitle?: string;

  @Field(() => String, { nullable: true, description: 'SEO meta description' })
  metaDescription?: string;

  @Field(() => String, { nullable: true, description: 'Warranty information' })
  warranty?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Warranty duration in months',
  })
  warrantyDuration?: number;

  @Field(() => [String], {
    nullable: true,
    description: 'Product features list',
  })
  features?: string[];

  @Field(() => Int, { nullable: true, description: 'Store subcategory ID' })
  subCategoryId?: number;
}
