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
 * Args for listing store categories with page-based pagination.
 */
@ArgsType()
export class GetStoreCategoriesArgs {
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
 * Args for fetching a single store category by ID (admin panel).
 */
@ArgsType()
export class GetStoreCategoryByIdArgs {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field(() => Language, { defaultValue: Language.ES })
  @IsEnum(Language)
  language: Language;
}

/**
 * Args for fetching a single store category by slug (web browsing).
 */
@ArgsType()
export class GetStoreCategoryBySlugArgs {
  @Field(() => String)
  @IsString()
  slug: string;

  @Field(() => Language, { defaultValue: Language.ES })
  @IsEnum(Language)
  language: Language;
}

/**
 * Args for fetching a store category together with its paginated products by ID (admin panel).
 */
@ArgsType()
export class GetStoreCategoryProductsByIdArgs extends GetStoreCategoryByIdArgs {
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

/**
 * Args for fetching a store category together with its paginated products by slug (web browsing).
 */
@ArgsType()
export class GetStoreCategoryProductsBySlugArgs extends GetStoreCategoryBySlugArgs {
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
