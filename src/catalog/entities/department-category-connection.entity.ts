import { ObjectType, Field } from '@nestjs/graphql';
import { DepartmentCategory } from './department-category.entity';
import { PageInfo } from './page-info.entity';

@ObjectType()
export class DepartmentCategoryConnection {
  @Field(() => [DepartmentCategory])
  nodes: DepartmentCategory[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}
