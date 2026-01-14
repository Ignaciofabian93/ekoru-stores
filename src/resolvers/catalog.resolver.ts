import { Resolver, Query, Args } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { Language } from '@prisma/client';
import { CatalogService } from '../services/catalog.service';
import { StoreCatalogItemEntity } from '../catalog-v2/entities/catalog.entity';
import type { StoreCatalog } from '../types/catalog';

/**
 * Catalog GraphQL Resolver
 *
 * This resolver handles queries for the store catalog.
 * Returns the complete menu structure with stores and subCategories.
 */
@Resolver()
export class CatalogResolver {
  private readonly logger = new Logger(CatalogResolver.name);

  constructor(private readonly catalogService: CatalogService) {}

  /**
   * Query: Get store catalog
   *
   * @example
   * query {
   *   getStoreCatalog(language: ES) {
   *     id
   *     name
   *     href
   *     slug
   *     subCategories {
   *       id
   *       name
   *       href
   *       slug
   *     }
   *   }
   * }
   */
  @Query(() => [StoreCatalogItemEntity], {
    name: 'getStoreCatalog',
    description: 'Get the complete store catalog with sub-categories',
  })
  async getStoreCatalog(
    @Args('language', { type: () => Language, defaultValue: Language.ES })
    language: Language,
  ): Promise<StoreCatalog> {
    this.logger.debug(`Query: getStoreCatalog - Language: ${language}`);
    return this.catalogService.getStoreCatalog(language);
  }
}
