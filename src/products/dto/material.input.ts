import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Language } from '@prisma/client';

/**
 * A single localized name for a material, e.g. { language: ES, name: "Algodón" }.
 * Combined into AddMaterialInput.translations.
 */
@InputType('MaterialTranslationInput')
export class MaterialTranslationInput {
  @Field(() => Language, { description: 'Language of this translation' })
  @IsEnum(Language)
  language: Language;

  @Field(() => String, { description: 'Localized material name' })
  @IsString()
  @IsNotEmpty()
  materialTypeTranslation: string;
}

/**
 * Admin-only input to register a new material in the MaterialImpactEstimate
 * catalog (with its impact data and localized names) so sellers can select it
 * when declaring a store product's composition.
 */
@InputType('AddMaterialInput')
export class AddMaterialInput {
  @Field(() => String, {
    description:
      'Unique material key in SCREAMING_SNAKE_CASE, e.g. "ORGANIC_COTTON". ' +
      'Normalized (uppercased, spaces to underscores) on the server.',
  })
  @IsString()
  @IsNotEmpty()
  materialType: string;

  @Field(() => Float, { description: 'Estimated CO2 savings in kilograms' })
  @IsNumber()
  @Min(0)
  estimatedCo2SavingsKG: number;

  @Field(() => Float, { description: 'Estimated water savings in liters' })
  @IsNumber()
  @Min(0)
  estimatedWaterSavingsLT: number;

  @Field(() => [MaterialTranslationInput], {
    nullable: true,
    description:
      'Localized names for the material (one per language). Optional, but ' +
      'recommended — without a translation the picker falls back to a ' +
      'humanized form of materialType.',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MaterialTranslationInput)
  translations?: MaterialTranslationInput[];
}
