import { Injectable } from '@nestjs/common';
import type { Language } from '@prisma/client';
import { ImpactRepository } from '../repositories/impact.repository';
import { MaterialImpactEstimateEntity } from '../catalog-v2/entities';
import { StoreProductMaterialCompositionEntity } from '../products/entities/store-product-material-composition.entity';

/**
 * Turns a raw material key like "ELECTRONIC_COMPONENTS" into a render-ready
 * "Electronic components". Used as a fallback when no translation row exists,
 * so the frontend never has to display a SCREAMING_SNAKE_CASE enum.
 */
function humanizeMaterialType(value: string): string {
  const normalized = value.replace(/_/g, ' ').trim().toLowerCase();
  if (!normalized) return value;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Material Service
 *
 * Exposes the catalog of material types (with localized labels) used to build a
 * product's material composition on the client.
 */
@Injectable()
export class MaterialService {
  constructor(private readonly impactRepository: ImpactRepository) {}

  async getMaterials(
    language?: Language,
  ): Promise<MaterialImpactEstimateEntity[]> {
    const materials = await this.impactRepository.findAllMaterials(language);

    return materials.map((material) => {
      const translated = language
        ? material.translations?.find((t) => t.language === language)
            ?.materialTypeTranslation
        : undefined;

      return {
        id: material.id,
        materialType: material.materialType,
        estimatedCo2SavingsKG: material.estimatedCo2SavingsKG,
        estimatedWaterSavingsLT: material.estimatedWaterSavingsLT,
        label: translated ?? humanizeMaterialType(material.materialType),
      };
    });
  }

  async getProductComposition(
    storeProductId: number,
    language?: Language,
  ): Promise<StoreProductMaterialCompositionEntity[]> {
    const rows = await this.impactRepository.findProductComposition(
      storeProductId,
      language,
    );

    return rows.map((row) => {
      const translated = language
        ? row.material.translations?.find((t) => t.language === language)
            ?.materialTypeTranslation
        : undefined;

      return {
        id: row.id,
        materialTypeId: row.materialTypeId,
        materialType: row.material.materialType,
        label: translated ?? humanizeMaterialType(row.material.materialType),
        percentage: row.percentage,
      };
    });
  }
}
