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
}
