import { Resolver, Query } from '@nestjs/graphql';
import { CatalogService } from './catalog.service';
import { Department, StoreCategory } from './entities';

@Resolver()
export class CatalogResolver {
  constructor(private readonly catalogService: CatalogService) {}

  @Query(() => [Department], { nullable: true, name: 'marketCatalog' })
  async getMarketCatalog() {
    return this.catalogService.getMarketCatalog();
  }

  @Query(() => [StoreCategory], { nullable: true, name: 'storeCatalog' })
  async getStoreCatalog() {
    return this.catalogService.getStoreCatalog();
  }
}
