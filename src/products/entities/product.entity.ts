import { ObjectType, Field, Int, Float, ID, Directive } from '@nestjs/graphql';
import { Badge, WeightUnit, DimensionUnit } from '@prisma/client';
import { EnvironmentalImpactEntity } from './environmental-impact.entity';
import { StoreSubCategoryEntity } from '../../storeSubCategories/entities';

/**
 * GraphQL Seller Entity Reference
 *
 * This is an external entity owned by the users subgraph.
 * We only reference it by its key field for federation.
 */
@ObjectType('Seller')
@Directive('@key(fields: "id")')
export class SellerEntity {
  @Field(() => ID, { description: 'Seller unique identifier' })
  id: string;
}

/**
 * GraphQL Product Entity
 *
 * Represents a marketplace product listing.
 */
@ObjectType('StoreProduct')
@Directive('@key(fields: "id")')
export class ProductEntity {
  @Field(() => Int, { description: 'Unique product identifier' })
  id: number;

  @Field(() => String, { description: 'Product name' })
  name: string;

  @Field(() => String, { description: 'Product description' })
  description: string;

  @Field(() => Int, { description: 'Product stock quantity' })
  stock: number;

  @Field(() => String, { description: 'Product barcode', nullable: true })
  barcode?: string;

  @Field(() => String, { description: 'Product SKU', nullable: true })
  sku?: string;

  @Field(() => Float, { description: 'Product price' })
  price: number;

  @Field(() => Boolean, { description: 'Whether product is on offer' })
  hasOffer: boolean;

  @Field(() => Float, { description: 'Product offer price', nullable: true })
  offerPrice?: number;

  @Field(() => String, { description: 'Seller ID' })
  sellerId: string;

  @Field(() => [String], { description: 'Product image URLs' })
  images: string[];

  @Field(() => Boolean, { description: 'Whether product is active' })
  isActive: boolean;

  @Field(() => [Badge], { description: 'Product badges' })
  badges: Badge[];

  @Field(() => String, { nullable: true, description: 'Product color' })
  color?: string;

  @Field(() => String, { nullable: true, description: 'Product brand' })
  brand?: string;

  // Metrics & Engagement
  @Field(() => Float, { description: 'Average product rating' })
  averageRating: number;

  @Field(() => Int, { description: 'Number of reviews' })
  reviewsNumber: number;

  @Field(() => Int, { description: 'Number of likes' })
  likesCount: number;

  @Field(() => Int, { description: 'Number of sales' })
  saleCount: number;

  @Field(() => Int, { description: 'Number of views' })
  viewCount: number;

  // Product Specifications
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
    description: 'Unit for weight measurement',
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
    description: 'Unit for dimensions (CM, M, MM, INCH, FOOT)',
  })
  dimensionUnit?: DimensionUnit;

  // Inventory Management
  @Field(() => Int, {
    nullable: true,
    description: 'Stock threshold for low stock alert',
  })
  lowStockThreshold?: number;

  @Field(() => Boolean, {
    description: 'Whether product is running low on stock',
  })
  isLowStock: boolean;

  // SEO & Search
  @Field(() => [String], { description: 'Product tags for search' })
  tags: string[];

  @Field(() => String, { nullable: true, description: 'SEO meta title' })
  metaTitle?: string;

  @Field(() => String, {
    nullable: true,
    description: 'SEO meta description',
  })
  metaDescription?: string;

  // Additional Info
  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether the product includes a warranty',
  })
  warranty?: boolean;

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

  @Field(() => Date, { description: 'Creation timestamp' })
  createdAt: Date;

  @Field(() => Date, { description: 'Last update timestamp' })
  updatedAt: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Deletion timestamp (soft delete)',
  })
  deletedAt?: Date;

  // Relations
  @Field(() => StoreSubCategoryEntity, {
    nullable: true,
    description: 'Product category details',
  })
  storeSubCategory?: StoreSubCategoryEntity;

  @Field(() => SellerEntity, {
    nullable: true,
    description: 'Seller who owns this product',
  })
  seller?: SellerEntity;

  @Field(() => EnvironmentalImpactEntity, {
    nullable: true,
    description:
      'Environmental impact estimate based on product category materials',
  })
  environmentalImpact?: EnvironmentalImpactEntity;
}
