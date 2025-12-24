import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';
import { Badge } from '../../graphql/enums';

@InputType()
export class AddProductInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  description: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  productCategoryId?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  barcode?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  sku?: string;

  @Field(() => Int)
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  hasOffer?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offerPrice?: number;

  @Field(() => [String])
  @IsArray()
  images: string[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  materialComposition?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  recycledContent?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  subcategoryId?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  sustainabilityScore?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  carbonFootprint?: number;
}
