import { Directive, ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType('StoreSubCategoryItem')
export class StoreSubCategoryItemEntity {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  href: string;

  @Field(() => String)
  slug: string;
}

@ObjectType('StoreCatalogItem')
@Directive('@key(fields: "id")')
export class StoreCatalogItemEntity {
  @Field(() => Int, { description: 'Unique identifier for the catalog item' })
  id: number;

  @Field(() => String, { description: 'Name of the catalog item' })
  name: string;

  @Field(() => String, { description: 'href of the catalog item' })
  href: string;

  @Field(() => String, { description: 'Slug of the catalog item' })
  slug: string;

  @Field(() => [StoreSubCategoryItemEntity], {
    description: 'List of sub-category items',
  })
  subCategoryItems: StoreSubCategoryItemEntity[];
}
