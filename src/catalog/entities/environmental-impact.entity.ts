import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class MaterialImpactBreakdown {
  @Field()
  materialType: string;

  @Field(() => Float)
  percentage: number;

  @Field(() => Float)
  weightKG: number;

  @Field(() => Float)
  co2SavingsKG: number;

  @Field(() => Float)
  waterSavingsLT: number;
}

@ObjectType()
export class EnvironmentalImpact {
  @Field(() => Float)
  totalCo2SavingsKG: number;

  @Field(() => Float)
  totalWaterSavingsLT: number;

  @Field(() => [MaterialImpactBreakdown])
  materialBreakdown: MaterialImpactBreakdown[];
}
