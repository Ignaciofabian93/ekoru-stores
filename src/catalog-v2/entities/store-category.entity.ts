import { ObjectType, Field, Int, Directive } from '@nestjs/graphql';
import { StoreCategoryTranslationEntity } from './store-category-translation.entity';
import { StoreSubCategoryEntity } from './store-sub-category.entity';

@ObjectType('StoreCategory')
@Directive('@key(fields: "id")')
export class StoreCategoryEntity {
  @Field(() => Int, { description: 'Unique identifier for the store category' })
  id: number;

  @Field(() => Boolean, {
    description: 'Indicates if the store category is active',
  })
  isActive: boolean;

  @Field(() => Int, { description: 'Sort order of the store category' })
  sortOrder: number;

  @Field(() => StoreCategoryTranslationEntity, {
    description: 'Translation details for the store category',
    nullable: true,
  })
  translation?: StoreCategoryTranslationEntity;

  @Field(() => [StoreSubCategoryEntity], {
    description: 'List of sub-categories under this store category',
  })
  storeSubCategory?: StoreSubCategoryEntity[];
}
