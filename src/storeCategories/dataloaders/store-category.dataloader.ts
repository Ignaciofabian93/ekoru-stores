import { Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  StoreCategory,
  StoreCategoryTranslation,
} from '../../types/store-category';
import type { Language } from '@prisma/client';

const logger = new Logger('StoreCategoryDataLoader');

/**
 * Creates a DataLoader for store category translations with composite key (id + language)
 *
 * @example
 * const loader = createStoreCategoryTranslationLoader(prisma);
 * const translation = await loader.load('1:ES');
 */
export function createStoreCategoryTranslationLoader(
  prisma: PrismaService,
): DataLoader<string, StoreCategoryTranslation | null> {
  return new DataLoader<string, StoreCategoryTranslation | null>(
    async (compositeKeys: readonly string[]) => {
      try {
        // Parse composite keys: "storeCategoryId:language"
        const keyPairs = compositeKeys.map((key) => {
          const [idStr, language] = key.split(':');
          return {
            storeCategoryId: parseInt(idStr, 10),
            language: language as Language,
          };
        });

        // Batch load all translations
        const translations = await prisma.storeCategoryTranslation.findMany({
          where: {
            OR: keyPairs.map(({ storeCategoryId, language }) => ({
              storeCategoryId,
              language,
            })),
          },
        });

        // Create a map for O(1) lookup
        const translationMap = new Map<string, StoreCategoryTranslation>();
        translations.forEach((translation) => {
          const key = `${translation.storeCategoryId}:${translation.language}`;
          translationMap.set(key, translation);
        });

        // Return results in the same order as requested keys
        return compositeKeys.map((key) => translationMap.get(key) || null);
      } catch (error) {
        const err = error as Error;
        logger.error(
          `Error loading store category translations: ${err.message}`,
          err.stack,
        );
        throw error;
      }
    },
    {
      cacheKeyFn: (key: string) => key,
    },
  );
}

/**
 * Creates a DataLoader for store categories by ID
 *
 * @example
 * const loader = createStoreCategoryByIdLoader(prisma);
 * const storeCategory = await loader.load(1);
 */
export function createStoreCategoryByIdLoader(
  prisma: PrismaService,
): DataLoader<number, StoreCategory | null> {
  return new DataLoader<number, StoreCategory | null>(
    async (ids: readonly number[]) => {
      try {
        const storeCategories = await prisma.storeCategory.findMany({
          where: {
            id: {
              in: [...ids],
            },
          },
        });

        const storeCategoryMap = new Map<number, StoreCategory>();
        storeCategories.forEach((category) => {
          storeCategoryMap.set(category.id, category);
        });

        return ids.map((id) => storeCategoryMap.get(id) || null);
      } catch (error) {
        const err = error as Error;
        logger.error(
          `Error loading store categories: ${err.message}`,
          err.stack,
        );
        throw error;
      }
    },
  );
}
