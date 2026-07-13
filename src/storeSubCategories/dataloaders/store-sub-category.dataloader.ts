import { Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  StoreSubCategory,
  StoreSubCategoryTranslation,
} from '../../types/store-sub-category';
import type { Language } from '@prisma/client';

const logger = new Logger('StoreSubCategoryDataLoader');

/**
 * Creates a DataLoader for store sub category translations with composite key (id + language)
 *
 * @example
 * const loader = createStoreSubCategoryTranslationLoader(prisma);
 * const translation = await loader.load('1:ES');
 */
export function createStoreSubCategoryTranslationLoader(
  prisma: PrismaService,
): DataLoader<string, StoreSubCategoryTranslation | null> {
  return new DataLoader<string, StoreSubCategoryTranslation | null>(
    async (compositeKeys: readonly string[]) => {
      try {
        // Parse composite keys: "storeSubCategoryId:language"
        const keyPairs = compositeKeys.map((key) => {
          const [idStr, language] = key.split(':');
          return {
            storeSubCategoryId: parseInt(idStr, 10),
            language: language as Language,
          };
        });

        // Batch load all translations
        const translations = await prisma.storeSubCategoryTranslation.findMany({
          where: {
            OR: keyPairs.map(({ storeSubCategoryId, language }) => ({
              storeSubCategoryId,
              language,
            })),
          },
        });

        // Create a map for O(1) lookup
        const translationMap = new Map<string, StoreSubCategoryTranslation>();
        translations.forEach((translation) => {
          const key = `${translation.storeSubCategoryId}:${translation.language}`;
          translationMap.set(key, translation);
        });

        // Return results in the same order as requested keys
        return compositeKeys.map((key) => translationMap.get(key) || null);
      } catch (error) {
        const err = error as Error;
        logger.error(
          `Error loading store sub category translations: ${err.message}`,
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
 * Creates a DataLoader for store sub categories grouped by store category ID
 *
 * @example
 * const loader = createStoreSubCategoriesByStoreCategoryLoader(prisma);
 * const subCategories = await loader.load(1);
 */
export function createStoreSubCategoriesByStoreCategoryLoader(
  prisma: PrismaService,
): DataLoader<number, StoreSubCategory[]> {
  return new DataLoader<number, StoreSubCategory[]>(
    async (storeCategoryIds: readonly number[]) => {
      try {
        const subCategories = await prisma.storeSubCategory.findMany({
          where: {
            storeCategoryId: {
              in: [...storeCategoryIds],
            },
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        });

        // Group sub categories by store category ID
        const subCategoryMap = new Map<number, StoreSubCategory[]>();
        subCategories.forEach((subCategory) => {
          const existing =
            subCategoryMap.get(subCategory.storeCategoryId) || [];
          subCategoryMap.set(subCategory.storeCategoryId, [
            ...existing,
            subCategory,
          ]);
        });

        // Return results in the same order as requested store category IDs
        return storeCategoryIds.map((id) => subCategoryMap.get(id) || []);
      } catch (error) {
        const err = error as Error;
        logger.error(
          `Error loading store sub categories: ${err.message}`,
          err.stack,
        );
        throw error;
      }
    },
  );
}
