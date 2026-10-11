import {
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { StoreStockMovementKind } from '@prisma/client';
import { IsInt, Min } from 'class-validator';

registerEnumType(StoreStockMovementKind, {
  name: 'StoreStockMovementKind',
  description: 'SALE takes units out of stock; RESTOCK puts them back.',
});

@InputType()
export class StockItemInput {
  @Field(() => Int)
  @IsInt()
  storeProductId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;
}

/** What happened to one product in a movement. */
@ObjectType()
export class StockMovementItem {
  @Field(() => Int)
  storeProductId: number;

  @Field(() => Int)
  requested: number;

  /** Units actually moved. Below `requested` on a SALE means oversold. */
  @Field(() => Int)
  applied: number;
}

@ObjectType()
export class StockAdjustmentResult {
  @Field(() => String)
  reference: string;

  @Field(() => StoreStockMovementKind)
  kind: StoreStockMovementKind;

  /** True when this reference had already been applied; nothing moved now. */
  @Field(() => Boolean)
  alreadyApplied: boolean;

  /** Every requested unit was moved. False on a SALE means something was oversold. */
  @Field(() => Boolean)
  complete: boolean;

  @Field(() => [StockMovementItem])
  items: StockMovementItem[];
}
