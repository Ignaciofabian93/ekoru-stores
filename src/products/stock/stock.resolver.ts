import { Args, Context, Mutation, Resolver, Directive } from '@nestjs/graphql';
import { StoreStockMovementKind } from '@prisma/client';
import { assertInternal } from '../../common/internal';
import { StockService } from './stock.service';
import { StockAdjustmentResult, StockItemInput } from './stock.types';

@Resolver()
export class StockResolver {
  constructor(private readonly stockService: StockService) {}

  /**
   * Internal (ekoru-transactions, TRX-3): takes sold units out of stock when a
   * store order is paid, and puts them back when it is refunded. Applied once
   * per reference. Needs the `x-internal-secret` header, which the gateway
   * never forwards.
   */
  // Internal: hidden from the public supergraph (GW-2); sibling services call it on this subgraph directly.
  @Directive('@inaccessible')
  @Mutation(() => StockAdjustmentResult, {
    name: 'adjustStoreProductStock',
    description:
      'Internal (ekoru-transactions): SALE or RESTOCK store product stock, once per reference.',
  })
  async adjustStoreProductStock(
    @Args('reference') reference: string,
    @Args('kind', { type: () => StoreStockMovementKind })
    kind: StoreStockMovementKind,
    @Args('items', { type: () => [StockItemInput] }) items: StockItemInput[],
    @Context() ctx: { internalSecret?: string },
  ): Promise<StockAdjustmentResult> {
    assertInternal(ctx.internalSecret);
    return await this.stockService.adjust({ reference, kind, items });
  }
}
