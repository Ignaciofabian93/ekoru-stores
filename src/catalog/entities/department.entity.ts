import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';
import { DepartmentCategory } from './department-category.entity';
import { ProductConnection } from './product-connection.entity';

@ObjectType()
@Directive('@key(fields: "id")')
export class Department {
  @Field(() => ID)
  id: number;

  @Field()
  departmentName: string;

  @Field(() => String, { nullable: true })
  departmentImage?: string | null;

  @Field(() => String, { nullable: true })
  href?: string | null;

  @Field(() => [DepartmentCategory])
  departmentCategory: DepartmentCategory[];

  @Field(() => ProductConnection, { nullable: true })
  products?: ProductConnection;
}
