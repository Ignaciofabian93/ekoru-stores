import { ProductsResolver } from './products.resolver';
import { ProductsService } from './products.service';
import { MaterialService } from '../services/material.service';
import { InternalServerError, NotFoundError } from '../common/exceptions';

describe('ProductsResolver.resolveReference', () => {
  const getProductById = jest.fn();
  const resolver = new ProductsResolver(
    { getProductById } as unknown as ProductsService,
    {} as MaterialService,
  );

  beforeEach(() => getProductById.mockReset());

  it('resolves a product another subgraph refers to', async () => {
    getProductById.mockResolvedValue({ id: 5, name: 'Reloj de madera' });
    await expect(
      resolver.resolveReference({ __typename: 'StoreProduct', id: 5 }),
    ).resolves.toEqual({ id: 5, name: 'Reloj de madera' });
  });

  it('answers null for a product that is gone, so a search result still loads', async () => {
    getProductById.mockRejectedValue(new NotFoundError('not found'));
    await expect(
      resolver.resolveReference({ __typename: 'StoreProduct', id: 5 }),
    ).resolves.toBeNull();
  });

  it('lets any other failure through', async () => {
    getProductById.mockRejectedValue(new InternalServerError('db down'));
    await expect(
      resolver.resolveReference({ __typename: 'StoreProduct', id: 5 }),
    ).rejects.toThrow('db down');
  });
});
