import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

/**
 * GraphQL entity for a single row of a store product's material composition:
 * one material and the percentage it makes up of the product.
 */
@ObjectType('StoreProductMaterialComposition')
export class StoreProductMaterialCompositionEntity {
  @Field(() => Int, { description: 'Composition row id' })
  id: number;

  @Field(() => Int, { description: 'MaterialImpactEstimate id' })
  materialTypeId: number;

  @Field(() => String, { description: 'Raw material key, e.g. COTTON' })
  materialType: string;

  @Field(() => String, {
    description: 'Localized material label for the requested language',
  })
  label: string;

  @Field(() => Float, { description: 'Percentage of the product (0-100)' })
  percentage: number;
}
