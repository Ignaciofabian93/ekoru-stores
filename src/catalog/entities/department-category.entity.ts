import { ObjectType, Field, ID, Int, Directive } from '@nestjs/graphql';
import { ProductCategory } from './product-category.entity';
import { ProductConnection } from './product-connection.entity';

@ObjectType()
@Directive('@key(fields: "id")')
export class DepartmentCategory {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  departmentId: number;

  @Field()
  departmentCategoryName: string;

  @Field(() => String, { nullable: true })
  href?: string | null;

  @Field(() => [ProductCategory], { nullable: true })
  productCategory?: ProductCategory[];

  @Field(() => ProductConnection, { nullable: true })
  products?: ProductConnection;
}
