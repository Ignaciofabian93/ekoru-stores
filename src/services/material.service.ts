import {
  Injectable,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { Language } from '@prisma/client';
import { ImpactRepository } from '../repositories/impact.repository';
import { MaterialImpactEstimateEntity } from '../catalog-v2/entities';
import { StoreProductMaterialCompositionEntity } from '../products/entities/store-product-material-composition.entity';
import { AddMaterialInput } from '../products/dto/material.input';

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

  /**
   * Admin-only: register a new material (impact data + localized names) so it
   * shows up in the composition picker. Sellers request new materials from us;
   * an admin adds them here instead of hand-writing SQL.
   */
  async addMaterial({
    input,
    adminId,
    language,
  }: {
    input: AddMaterialInput;
    adminId?: string;
    language?: Language;
  }): Promise<MaterialImpactEstimateEntity> {
    if (!adminId) {
      throw new ForbiddenException(
        'Admin privileges are required to add a material.',
      );
    }

    // Normalize to the SCREAMING_SNAKE_CASE key convention (e.g. "organic cotton" -> "ORGANIC_COTTON").
    const materialType = input.materialType
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');

    if (!materialType) {
      throw new BadRequestException('materialType cannot be empty.');
    }

    const translations = input.translations ?? [];
    const languages = translations.map((t) => t.language);
    if (new Set(languages).size !== languages.length) {
      throw new BadRequestException(
        'Duplicate language in translations; provide at most one name per language.',
      );
    }

    const existing =
      await this.impactRepository.findMaterialByType(materialType);
    if (existing) {
      throw new ConflictException(`Material "${materialType}" already exists.`);
    }

    const created = await this.impactRepository.createMaterial({
      materialType,
      estimatedCo2SavingsKG: input.estimatedCo2SavingsKG,
      estimatedWaterSavingsLT: input.estimatedWaterSavingsLT,
      translations,
    });

    const translated = language
      ? created.translations?.find((t) => t.language === language)
          ?.materialTypeTranslation
      : undefined;

    return {
      id: created.id,
      materialType: created.materialType,
      estimatedCo2SavingsKG: created.estimatedCo2SavingsKG,
      estimatedWaterSavingsLT: created.estimatedWaterSavingsLT,
      label: translated ?? humanizeMaterialType(created.materialType),
    };
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
