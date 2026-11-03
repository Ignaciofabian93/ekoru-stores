import { Field, InputType, Int, Float } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Badge,
  WeightUnit,
  DimensionUnit,
  ProductSize,
} from '../../graphql/enums';
import { StoreProductMaterialInput } from '../../products/dto/product.input';

/**
 * One line of a business's publishing spreadsheet (ADM-16). The fields a
 * store sets on the web when it publishes, and nothing else: never the seller
 * (always the caller's store), featured dates or metrics.
 *
 * - no `id` → a new product: name, description, price, stock, subCategoryId
 *   and materials are required, as on the web;
 * - `id` → one of the store's own products: only the sent fields change, and
 *   materials, when sent, replace the composition.
 */
@InputType()
export class BusinessStoreProductRowInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Int, { nullable: true, description: 'Price in whole pesos' })
  @IsOptional()
  @IsInt()
  @Min(1)
  price?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  subCategoryId?: number;

  @Field(() => [StoreProductMaterialInput], {
    nullable: true,
    description:
      'Material + percentage pairs adding up to 100. Required for a new product.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreProductMaterialInput)
  materials?: StoreProductMaterialInput[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  hasOffer?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  offerPrice?: number | null;

  @Field(() => [String], {
    nullable: true,
    description:
      "Photos already on EKORU's image hosts (the export carries them). A product with none is saved hidden.",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @Field(() => Boolean, {
    nullable: true,
    description: 'Shown in the store. Ignored (false) while it has no photo.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => [Badge], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(Badge, { each: true })
  badges?: Badge[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  brand?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  color?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  sku?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  barcode?: string | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  recycledContent?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number | null;

  @Field(() => WeightUnit, { nullable: true })
  @IsOptional()
  @IsEnum(WeightUnit)
  weightUnit?: WeightUnit;

  @Field(() => ProductSize, { nullable: true })
  @IsOptional()
  @IsEnum(ProductSize)
  size?: ProductSize | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number | null;

  @Field(() => DimensionUnit, { nullable: true })
  @IsOptional()
  @IsEnum(DimensionUnit)
  dimensionUnit?: DimensionUnit;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  warranty?: boolean;

  @Field(() => Int, { nullable: true, description: 'Months' })
  @IsOptional()
  @IsInt()
  @Min(0)
  warrantyDuration?: number | null;
}
