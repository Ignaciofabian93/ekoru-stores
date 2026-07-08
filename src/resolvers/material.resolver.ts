import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { MaterialImpactEstimateEntity } from '../catalog-v2/entities';
import { Language } from '../graphql/enums';
import { MaterialService } from '../services/material.service';
import { CurrentAdmin } from '../common/decorators';
import { AddMaterialInput } from '../products/dto/material.input';

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

  /**
   * Mutation (admin-only): register a new material with its impact data and
   * localized names, so it becomes selectable in the composition picker.
   *
   * @example
   * mutation {
   *   addMaterial(input: {
   *     materialType: "ORGANIC_COTTON",
   *     estimatedCo2SavingsKG: 3.8,
   *     estimatedWaterSavingsLT: 7000,
   *     translations: [
   *       { language: ES, materialTypeTranslation: "Algodón orgánico" },
   *       { language: EN, materialTypeTranslation: "Organic cotton" }
   *     ]
   *   }) { id materialType label }
   * }
   */
  @Mutation(() => MaterialImpactEstimateEntity, {
    name: 'addMaterial',
    description:
      'Admin-only: add a new material (impact data + localized names) to the catalog.',
  })
  async addMaterial(
    @Args('input') input: AddMaterialInput,
    @CurrentAdmin() adminId?: string,
    @Args('language', { type: () => Language, nullable: true })
    language?: Language,
  ): Promise<MaterialImpactEstimateEntity> {
    this.logger.debug(`Mutation: addMaterial ${input.materialType}`);
    return this.materialService.addMaterial({ input, adminId, language });
  }
}
