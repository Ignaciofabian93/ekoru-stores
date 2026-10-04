import { Injectable, Logger } from '@nestjs/common';
import type { Language, WeightUnit } from '@prisma/client';
import { ImpactRepository } from '../repositories/impact.repository';
import {
  EnvironmentalImpactEntity,
  MaterialBreakdown,
} from '../products/entities/environmental-impact.entity';

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
 * Conversion factors to normalize a weight into kilograms. Material impact
 * estimates are stored per kg, so every weight must be in kg before it can
 * scale them. Same table as the marketplace impact service.
 */
const WEIGHT_TO_KG: Record<WeightUnit, number> = {
  KG: 1,
  G: 0.001,
  LB: 0.45359237,
  OZ: 0.028349523125,
};

type DeclaredWeight = {
  weight: number | null;
  weightUnit: WeightUnit | null;
  storeSubCategory: {
    averageWeight: number | null;
    weightUnit: WeightUnit | null;
  } | null;
};

/**
 * Impact Service
 *
 * Calculates environmental impact for an individual store product based on the
 * material composition its seller declared (StoreProductMaterialComposition),
 * each material's per-kg impact estimate, and the product's weight.
 */
@Injectable()
export class ImpactService {
  private readonly logger = new Logger(ImpactService.name);

  constructor(private readonly impactRepository: ImpactRepository) {}

  /**
   * Calculate total environmental impact for a store product.
   *
   * Each material accounts for its percentage of the product's weight, and its
   * per-kg estimate is scaled by that mass. Returns null when there is nothing
   * to claim: no composition, or only materials scored at zero (consumables
   * such as food or cosmetic ingredients).
   */
  async calculateProductImpact(
    storeProductId: number,
    language?: Language,
  ): Promise<EnvironmentalImpactEntity | null> {
    try {
      // The product's declared composition (translations filtered to `language`
      // when supplied, so we can resolve a localized name below) plus the
      // weights used to turn per-kg estimates into per-product figures.
      const [composition, weights] = await Promise.all([
        this.impactRepository.findProductComposition(storeProductId, language),
        this.impactRepository.findProductWeight(storeProductId),
      ]);

      if (!composition || composition.length === 0) {
        this.logger.debug(
          `No material composition found for product ${storeProductId}`,
        );
        return null;
      }

      const scored = composition.some(
        (row) =>
          (row.material?.estimatedCo2SavingsKG ?? 0) > 0 ||
          (row.material?.estimatedWaterSavingsLT ?? 0) > 0,
      );
      if (!scored) {
        this.logger.debug(
          `Product ${storeProductId} only declares unscored materials`,
        );
        return null;
      }

      const productWeightKG = this.resolveProductWeightKG(
        weights ?? null,
        storeProductId,
      );

      let totalCo2SavingsKG = 0;
      let totalWaterSavingsLT = 0;
      const materialBreakdown: MaterialBreakdown[] = [];

      // Calculate impact for each declared material
      for (const row of composition) {
        if (!row.material) {
          this.logger.warn(`Material ${row.materialTypeId} has no impact data`);
          continue;
        }

        const material = row.material;

        // This material's share of the product's mass, in kg. Composition
        // percentages are 0-100.
        const materialKG = (row.percentage / 100) * productWeightKG;

        // Estimates are per kilogram, so scale them by this material's mass.
        const co2Savings = material.estimatedCo2SavingsKG * materialKG;
        const waterSavings = material.estimatedWaterSavingsLT * materialKG;

        totalCo2SavingsKG += co2Savings;
        totalWaterSavingsLT += waterSavings;

        // Prefer the localized name for the request language; fall back to a
        // humanized form of the raw key so the FE never renders "PLASTIC".
        const translated = language
          ? material.translations?.find((t) => t.language === language)
              ?.materialTypeTranslation
          : undefined;

        materialBreakdown.push({
          materialType: material.materialType,
          materialTypeLabel:
            translated ?? humanizeMaterialType(material.materialType),
          quantity: row.percentage,
          unit: 'percentage',
          co2SavingsKG: co2Savings,
          waterSavingsLT: waterSavings,
        });
      }

      return {
        totalCo2SavingsKG: Math.round(totalCo2SavingsKG * 100) / 100, // Round to 2 decimals
        totalWaterSavingsLT: Math.round(totalWaterSavingsLT * 100) / 100,
        materialBreakdown,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating impact for product ${storeProductId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Resolve a product's weight to kilograms: the seller's declared weight
   * first, then the subcategory's average weight.
   *
   * When neither is set (null or <= 0) we fall back to 1kg and warn, so the
   * product still reports its per-kg estimates instead of collapsing to zero
   * impact until a weight is set.
   */
  private resolveProductWeightKG(
    weights: DeclaredWeight | null,
    storeProductId: number,
  ): number {
    const candidates = [
      { value: weights?.weight, unit: weights?.weightUnit },
      {
        value: weights?.storeSubCategory?.averageWeight,
        unit: weights?.storeSubCategory?.weightUnit,
      },
    ];

    for (const { value, unit } of candidates) {
      if (value != null && value > 0) {
        return value * WEIGHT_TO_KG[unit ?? 'KG'];
      }
    }

    this.logger.warn(
      `Product ${storeProductId} has no weight and its subcategory no ` +
        `averageWeight; defaulting to 1kg so impact reflects per-kg estimates.`,
    );
    return 1;
  }
}
