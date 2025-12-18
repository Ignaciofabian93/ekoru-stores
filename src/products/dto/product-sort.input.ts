import { InputType, Field } from '@nestjs/graphql';
import { ProductSortField, SortOrder } from '../../graphql/enums';

@InputType()
export class ProductSortInput {
  @Field(() => ProductSortField, {
    nullable: true,
    defaultValue: ProductSortField.CREATED_AT,
  })
  field?: ProductSortField;

  @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.DESC })
  order?: SortOrder;
}
