import { registerEnumType } from '@nestjs/graphql';
import {
  Language,
  Badge,
  ProductSize,
  WeightUnit,
  DimensionUnit,
} from '@prisma/client';

// Local enums not present in Prisma schema
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum StoreProductSortField {
  CREATED_AT = 'CREATED_AT',
  PRICE = 'PRICE',
  NAME = 'NAME',
  RATING = 'RATING',
  STOCK = 'STOCK',
}

/**
 * Single source of truth for all enum registrations.
 * All enums are imported from @prisma/client to ensure the exact same
 * enum objects are registered and used in @Field() decorators.
 */
registerEnumType(Language, {
  name: 'Language',
  description: 'Supported languages for multi-language content',
});

registerEnumType(Badge, {
  name: 'Badge',
  description: 'Product badge types for special designations',
});

registerEnumType(ProductSize, {
  name: 'ProductSize',
  description: 'Product size categories',
});

registerEnumType(WeightUnit, {
  name: 'WeightUnit',
  description: 'Weight measurement units',
});

registerEnumType(DimensionUnit, {
  name: 'DimensionUnit',
  description: 'Units for measuring dimensions (CM, M, MM, INCH, FOOT)',
});

registerEnumType(SortOrder, {
  name: 'SortOrder',
  description: 'Sort order direction',
});

registerEnumType(StoreProductSortField, {
  name: 'StoreProductSortField',
  description: 'Store product sort field options',
});

export { Language, Badge, ProductSize, WeightUnit, DimensionUnit };
