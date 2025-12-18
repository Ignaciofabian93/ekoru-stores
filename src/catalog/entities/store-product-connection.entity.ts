import { ObjectType, Field } from '@nestjs/graphql';
import { StoreProduct } from './store-product.entity';
import { PageInfo } from './page-info.entity';

@ObjectType()
export class StoreProductConnection {
  @Field(() => [StoreProduct])
  nodes: StoreProduct[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}
