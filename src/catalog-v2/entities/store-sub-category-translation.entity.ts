import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Language } from '../../graphql/enums';

/**
 * GraphQL StoreSubCategoryTranslation Entity
 */
@ObjectType('StoreSubCategoryTranslation')
export class StoreSubCategoryTranslationEntity {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  storeSubCategoryId: number;

  @Field(() => Language)
  language: Language;

  @Field(() => String)
  name: string;

  @Field(() => String)
  slug: string;

  @Field(() => [String])
  keywords: string[];

  @Field(() => String, { nullable: true })
  href?: string;

  @Field(() => String, { nullable: true })
  metaTitle?: string;

  @Field(() => String, { nullable: true })
  metaDescription?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
