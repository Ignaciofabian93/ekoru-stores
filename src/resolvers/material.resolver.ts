import { Resolver, Query, Args } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { MaterialImpactEstimateEntity } from '../catalog-v2/entities';
import { Language } from '../graphql/enums';
import { MaterialService } from '../services/material.service';

@Resolver(() => MaterialImpactEstimateEntity)
export class MaterialResolver {
  private readonly logger = new Logger(MaterialResolver.name);

  constructor(private readonly materialService: MaterialService) {}

  /**
   * Query: all material types with localized labels.
   *
   * Powers the product material-composition picker on the client.
   *
   * @example
   * query {
   *   materials(language: ES) { id materialType label }
   * }
   */
  @Query(() => [MaterialImpactEstimateEntity], {
    name: 'materials',
    description:
      'All material types with localized labels, for the product material-composition picker.',
  })
  async materials(
    @Args('language', { type: () => Language, nullable: true })
    language?: Language,
  ): Promise<MaterialImpactEstimateEntity[]> {
    this.logger.debug(`Query: materials with language: ${language}`);
    return this.materialService.getMaterials(language);
  }
}
