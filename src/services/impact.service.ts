import { Injectable, Logger } from '@nestjs/common';
import type { Language } from '@prisma/client';
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
 * Impact Service
 *
 * Calculates environmental impact for an individual store product based on the
 * material composition its seller declared (StoreProductMaterialComposition)
 * and each material's impact estimate.
 */
@Injectable()
export class ImpactService {
  private readonly logger = new Logger(ImpactService.name);

  constructor(private readonly impactRepository: ImpactRepository) {}

  /**
   * Calculate total environmental impact for a store product.
   *
   * Aggregates CO2 and water savings across the product's declared materials,
   * weighting each material's impact estimate by the percentage it makes up of
   * the product.
   */
  async calculateProductImpact(
    storeProductId: number,
    language?: Language,
  ): Promise<EnvironmentalImpactEntity | null> {
    try {
      // The product's declared composition (translations filtered to `language`
      // when supplied, so we can resolve a localized name below).
      const composition = await this.impactRepository.findProductComposition(
        storeProductId,
        language,
      );

      if (!composition || composition.length === 0) {
        this.logger.debug(
          `No material composition found for product ${storeProductId}`,
        );
        return null;
      }

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

        // Composition percentages are 0-100, so weight the per-unit estimate.
        const multiplier = row.percentage / 100;

        const co2Savings = material.estimatedCo2SavingsKG * multiplier;
        const waterSavings = material.estimatedWaterSavingsLT * multiplier;

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
}
