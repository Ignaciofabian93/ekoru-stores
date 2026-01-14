import {
  ObjectType,
  Field,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { ProductSize, WeightUnit } from '@prisma/client';
import { StoreSubCategoryTranslationEntity } from './store-sub-category-translation.entity';

// Register enums for GraphQL
registerEnumType(ProductSize, {
  name: 'ProductSize',
  description: 'Product size categories',
});

registerEnumType(WeightUnit, {
  name: 'WeightUnit',
  description: 'Weight measurement units',
});

/**
 * GraphQL StoreSubCategory Entity
 */
@ObjectType('StoreSubCategory')
export class StoreSubCategoryEntity {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  storeSubCategoryId: number;

  @Field(() => Float, { nullable: true })
  averageWeight?: number;

  @Field(() => ProductSize, { nullable: true })
  size?: ProductSize;

  @Field(() => WeightUnit, { nullable: true })
  weightUnit?: WeightUnit;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Int)
  sortOrder: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => StoreSubCategoryTranslationEntity, { nullable: true })
  translation?: StoreSubCategoryTranslationEntity;
}
