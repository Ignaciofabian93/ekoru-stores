import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Badge } from '../../graphql/enums';

@InputType()
export class ProductFilterInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  subcategoryId?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  storeCategoryId?: number;

  @Field(() => [Badge], { nullable: true })
  @IsOptional()
  @IsArray()
  badges?: Badge[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  brand?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  color?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  hasOffer?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  minStock?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  minRating?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  minRecycledContent?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  minSustainabilityScore?: number;
}
