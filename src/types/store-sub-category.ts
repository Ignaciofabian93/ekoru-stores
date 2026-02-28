import { Language, ProductSize, WeightUnit } from '@prisma/client';
import { MaterialImpactEstimate } from './impact';

export type StoreSubCategory = {
  id: number;
  storeCategoryId: number;
  isActive: boolean;
  sortOrder: number;
  featuredFrom: Date | null;
  featuredUntil: Date | null;
  averageWeight: number | null;
  size: ProductSize | null;
  weightUnit: WeightUnit | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StoreProductMaterial = {
  id: number;
  storeSubCategoryId: number;
  materialTypeId: number;
  quantity: number;
  unit: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  material: MaterialImpactEstimate;
  storeSubCategory: StoreSubCategory;
};

export type StoreSubCategoryTranslation = {
  id: number;
  storeSubCategoryId: number;
  language: Language;
  name: string;
  slug: string;
  keywords: string[];
  href: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
