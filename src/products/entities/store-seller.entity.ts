import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { SellerEntity } from './product.entity';

/**
 * A business with store products the public can see, for the stores row on
 * /stores. `seller` is a federation reference: the gateway fills in the name
 * and logo from ekoru-users.
 */
@ObjectType('StoreSeller')
export class StoreSellerEntity {
  @Field(() => ID)
  sellerId: string;

  @Field(() => Int, {
    description: 'Visible products, within the category when one was given.',
  })
  productCount: number;

  @Field(() => SellerEntity)
  seller: { __typename: 'Seller'; id: string };
}
