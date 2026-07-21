import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { ProductSize, WeightUnit } from '@prisma/client';
import { StoreSubCategoryTranslationEntity } from './store-sub-category-translation.entity';
import { StoreCategoryEntity } from '../../storeCategories';

/**
 * GraphQL StoreSubCategory Entity
 *
 * This is the code-first GraphQL type definition for StoreSubCategory.
 * It corresponds to the StoreSubCategory model in Prisma schema.
 */
@ObjectType('StoreSubCategory')
export class StoreSubCategoryEntity {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  storeCategoryId: number;

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

  @Field(() => StoreCategoryEntity, { nullable: true })
  storeCategory?: StoreCategoryEntity;
}
