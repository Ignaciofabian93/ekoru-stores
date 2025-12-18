import { ObjectType, Field } from '@nestjs/graphql';
import { StoreSubCategory, PageInfo } from '../../catalog/entities';

@ObjectType()
export class StoreSubCategoryConnection {
  @Field(() => [StoreSubCategory])
  nodes: StoreSubCategory[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}
