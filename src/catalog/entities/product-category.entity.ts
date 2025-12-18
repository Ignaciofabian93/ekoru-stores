import { ObjectType, Field, ID, Int, Float, Directive } from '@nestjs/graphql';
import { ProductSize, WeightUnit } from '../../graphql/enums';
import { ProductCategoryMaterial } from './product-category-material.entity';
import { ProductConnection } from './product-connection.entity';
import { DepartmentCategory } from './department-category.entity';

@ObjectType()
@Directive('@key(fields: "id")')
export class ProductCategory {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  departmentCategoryId: number;

  @Field()
  productCategoryName: string;

  @Field(() => [String], { nullable: true })
  keywords?: string[];

  @Field(() => ProductSize, { nullable: true })
  size?: ProductSize | null;

  @Field(() => Float, { nullable: true })
  averageWeight?: number | null;

  @Field(() => WeightUnit, { nullable: true })
  weightUnit?: WeightUnit | null;

  @Field(() => String, { nullable: true })
  href?: string | null;

  @Field(() => ProductConnection, { nullable: true })
  products?: ProductConnection;

  @Field(() => DepartmentCategory, { nullable: true })
  departmentCategory?: DepartmentCategory;

  @Field(() => [ProductCategoryMaterial], { nullable: true })
  materials?: ProductCategoryMaterial[];
}
