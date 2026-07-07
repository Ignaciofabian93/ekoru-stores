import { Injectable } from '@nestjs/common';
import type { Language } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Impact Repository
 *
 * Handles data access for environmental impact calculations.
 * Fetches product category materials and their impact estimates.
 */
@Injectable()
export class ImpactRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all materials and their impact data for a store sub category.
   *
   * When `language` is provided, each material's translations are filtered to
   * that language so the caller can resolve a localized material name without
   * an extra round-trip.
   */
  async getStoreProductMaterials(
    storeSubCategoryId: number,
    language?: Language,
  ) {
    return this.prisma.storeProductMaterial.findMany({
      where: {
        storeSubCategoryId,
      },
      include: {
        material: {
          include: {
            translations: language ? { where: { language } } : true,
          },
        },
      },
    });
  }

  /**
   * Get material impact estimate by ID
   */
  getMaterialImpactById(materialTypeId: number) {
    return this.prisma.materialImpactEstimate.findUnique({
      where: {
        id: materialTypeId,
      },
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
