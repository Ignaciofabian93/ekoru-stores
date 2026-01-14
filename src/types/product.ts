import { Badge, ProductSize } from '@prisma/client';
import { StoreSubCategory } from './store-sub-category';
import { MaterialImpactEstimate } from './impact';

export type ProductCategoryMaterial = {
  id: number;
  productCategoryId: number;
  materialTypeId: number;
  quantity: number;
  unit: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  material: MaterialImpactEstimate;
  productCategory: ProductCategory;
};

export type ProductCategory = {
  id: number;
};

export type StoreProduct = {
  id: number;
  name: string;
  description: string;
  stock: number;
  barcode?: string | null;
  sku?: string | null;
  price: number;
  hasOffer: boolean;
  offerPrice?: number | null;
  sellerId: string;
  createdAt: Date;
  images: string[];
  isActive: boolean;
  updatedAt: Date;
  badges: Badge[];
  brand?: string | null;
  color?: string | null;
  ratingCount: number;
  ratings: number;
  reviewsNumber: number;
  materialComposition?: string | null;
  recycledContent?: number | null;
  subcategoryId: number;
  deletedAt?: Date | null;
  sustainabilityScore?: number | null;
  carbonFootprint?: number | null;
  saleCount: number;
  viewCount: number;
  advertisement: Advertisement[];
  productComment: ProductComment[];
  productLike: ProductLike[];
  productVariant: ProductVariant[];
  seller: Seller;
  storeSubCategory: StoreSubCategory;
  StoreProductReview: StoreProductReview[];
};

export type ProductVariant = {
  id: number;
  storeProductId: number;
  name: string;
  price: number;
  stock: number;
  color?: string | null;
  size: ProductSize;
  createdAt: Date;
  updatedAt: Date;
  product: StoreProduct;
};

export type Advertisement = {
  id: number;
};

export type ProductComment = {
  id: number;
};

export type ProductLike = {
  id: number;
};

export type Seller = {
  id: string;
};

export type StoreProductReview = {
  id: number;
};
