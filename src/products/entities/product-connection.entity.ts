import { ObjectType, Field } from '@nestjs/graphql';
import { ProductEntity } from './product.entity';
import { PageInfoEntity } from './page-info.entity';

/**
 * GraphQL StoreProduct Connection Entity
 *
 * Represents a paginated list of store products following the connection pattern.
 * Used for all queries that return multiple store products with pagination.
 */
@ObjectType('StoreProductConnection')
export class ProductConnectionEntity {
  @Field(() => [ProductEntity], {
    description: 'List of store products',
    nullable: true,
  })
  nodes: ProductEntity[];

  @Field(() => PageInfoEntity, { description: 'Pagination information' })
  pageInfo: PageInfoEntity;
}
