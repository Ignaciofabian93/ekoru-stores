import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { Language } from '../../graphql/enums';

// Register the Language enum for GraphQL
registerEnumType(Language, {
  name: 'Language',
  description: 'Supported languages',
});

@ObjectType('StoreCategoryTranslation')
export class StoreCategoryTranslationEntity {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  storeCategoryId: number;

  @Field(() => Language)
  language: Language;

  @Field(() => String)
  name: string;

  @Field(() => String)
  slug: string;

  @Field(() => String, { nullable: true })
  href?: string;

  @Field(() => String, { nullable: true })
  metaTitle?: string;

  @Field(() => String, { nullable: true })
  metaDescription?: string;

  @Field(() => [String])
  metaKeywords: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
