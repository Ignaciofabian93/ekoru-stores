import { Language, ProductSize, WeightUnit } from '@prisma/client';

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
