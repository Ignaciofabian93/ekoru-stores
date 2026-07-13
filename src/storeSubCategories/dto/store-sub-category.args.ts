import { ArgsType, Field, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Language } from '../../graphql/enums';
import {
  StoreProductFilterInput,
  StoreProductSortInput,
} from '../../products/dto/product.input';

/**
 * Args for listing store sub categories with page-based pagination.
 */
@ArgsType()
export class GetStoreSubCategoriesArgs {
  @Field(() => Int, { defaultValue: 1, description: 'Page number (1-based)' })
  @IsInt()
  page: number;

  @Field(() => Int, { defaultValue: 20, description: 'Items per page' })
  @IsInt()
  pageSize: number;

  @Field(() => Language, { defaultValue: Language.ES })
  @IsEnum(Language)
  language: Language;
}

/**
 * Args for fetching a single store sub category by ID (admin panel).
 */
@ArgsType()
export class GetStoreSubCategoryByIdArgs {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field(() => Language, { defaultValue: Language.ES })
  @IsEnum(Language)
  language: Language;
}

/**
 * Args for fetching a single store sub category by slug (web browsing).
 */
@ArgsType()
export class GetStoreSubCategoryBySlugArgs {
  @Field(() => String)
  @IsString()
  slug: string;

  @Field(() => Language, { defaultValue: Language.ES })
  @IsEnum(Language)
  language: Language;
}

/**
 * Args for fetching the paginated products of a store sub category by slug.
 */
@ArgsType()
export class GetStoreSubCategoryProductsBySlugArgs extends GetStoreSubCategoryBySlugArgs {
  @Field(() => Int, { defaultValue: 1, description: 'Page number (1-based)' })
  @IsInt()
  page: number;

  @Field(() => Int, { defaultValue: 20, description: 'Items per page' })
  @IsInt()
  pageSize: number;

  @Field(() => StoreProductFilterInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => StoreProductFilterInput)
  filter?: StoreProductFilterInput;

  @Field(() => StoreProductSortInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => StoreProductSortInput)
  sort?: StoreProductSortInput;
}
