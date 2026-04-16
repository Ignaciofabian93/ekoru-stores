import { Language } from '../graphql/enums';

export type StoreCategory = {
  id: number;
  isActive: boolean;
  sortOrder: number;
  featuredFrom: Date | null;
  featuredUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StoreCategoryTranslation = {
  id: number;
  storeCategoryId: number;
  language: Language;
  name: string;
  slug: string;
  href?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
};
