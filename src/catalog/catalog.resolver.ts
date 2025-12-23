import { Resolver, Query } from '@nestjs/graphql';
import { StoreCatalogService } from './catalog.service';
import { StoreCategory } from './entities';

@Resolver()
export class StoreCatalogResolver {
  constructor(private readonly catalogService: StoreCatalogService) {}

  @Query(() => [StoreCategory], { nullable: true, name: 'storeCatalog' })
  async getStoreCatalog() {
    return this.catalogService.getStoreCatalog();
  }
}
