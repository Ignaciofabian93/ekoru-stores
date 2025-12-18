import { ObjectType, Field } from '@nestjs/graphql';
import { ProductCategory } from './product-category.entity';
import { PageInfo } from './page-info.entity';

@ObjectType()
export class ProductCategoryConnection {
  @Field(() => [ProductCategory])
  nodes: ProductCategory[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}
