import { Injectable } from '@nestjs/common';
import type { Language } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Impact Repository
 *
 * Handles data access for environmental impact calculations.
 * Fetches a product's declared material composition and impact estimates.
 */
@Injectable()
export class ImpactRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Look up a material by its unique type key (e.g. "COTTON"). */
  findMaterialByType(materialType: string) {
    return this.prisma.materialImpactEstimate.findUnique({
      where: { materialType },
    });
  }

  /**
   * Create a new material (with impact data) and its localized names in one
   * transaction. Returns the material with its translations included.
   */
  createMaterial({
    materialType,
    estimatedCo2SavingsKG,
    estimatedWaterSavingsLT,
    translations,
  }: {
    materialType: string;
    estimatedCo2SavingsKG: number;
    estimatedWaterSavingsLT: number;
    translations?: { language: Language; materialTypeTranslation: string }[];
  }) {
    return this.prisma.materialImpactEstimate.create({
      data: {
        materialType,
        estimatedCo2SavingsKG,
        estimatedWaterSavingsLT,
        ...(translations?.length && {
          translations: {
            create: translations.map((t) => ({
              language: t.language,
              materialTypeTranslation: t.materialTypeTranslation,
            })),
          },
        }),
      },
      include: { translations: true },
    });
  }

  /**
   * List every material type with its impact data, for the composition picker.
   *
   * When `language` is provided, translations are filtered to that language so
   * the caller can resolve a localized label without an extra round-trip.
   */
  findAllMaterials(language?: Language) {
    return this.prisma.materialImpactEstimate.findMany({
      orderBy: { materialType: 'asc' },
      include: {
        translations: language ? { where: { language } } : true,
      },
    });
  }

  /**
   * Get a store product's declared material composition (material + percentage),
   * with each material's translations filtered to `language` when provided.
   */
  findProductComposition(storeProductId: number, language?: Language) {
    return this.prisma.storeProductMaterialComposition.findMany({
      where: { storeProductId },
      orderBy: { percentage: 'desc' },
      include: {
        material: {
          include: {
            translations: language ? { where: { language } } : true,
          },
        },
      },
    });
  }
}
