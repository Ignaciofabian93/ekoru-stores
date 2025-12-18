import { ObjectType, Field } from '@nestjs/graphql';
import { Product } from './product.entity';
import { PageInfo } from './page-info.entity';

@ObjectType()
export class ProductConnection {
  @Field(() => [Product])
  nodes: Product[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}
