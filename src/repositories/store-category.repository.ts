import { Injectable, Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import type {
  StoreCategory,
  StoreCategoryTranslation,
} from '../types/store-category';
import type { Language } from '@prisma/client';

@Injectable()
export class StoreCategoryRepository {
  private readonly logger = new Logger(StoreCategoryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a DataLoader for store categories translations with composite key (id + language)
   *
   * @returns {DataLoader<string, StoreCategoryTranslation | null>} DataLoader instance
   *
   * @example
   * const loader = createTranslationLoader();
   * const translation = await loader.load('1:ES');
   */
  createTranslationLoader(): DataLoader<
    string,
    StoreCategoryTranslation | null
  > {
    return new DataLoader<string, StoreCategoryTranslation | null>(
      async (compositeKeys: readonly string[]) => {
        try {
          const keyPairs = compositeKeys.map((key) => {
            const [idStr, language] = key.split(':');
            return {
              storeCategoryId: parseInt(idStr, 10),
              language: language as Language,
            };
          });

          const translations =
            await this.prisma.storeCategoryTranslation.findMany({
              where: {
                OR: keyPairs.map(({ storeCategoryId, language }) => ({
                  storeCategoryId,
                  language,
                })),
              },
            });

          const translationMap = new Map<string, StoreCategoryTranslation>();
          translations.forEach((translation) => {
            const key = `${translation.storeCategoryId}:${translation.language}`;
            translationMap.set(key, translation);
          });

          return compositeKeys.map((key) => translationMap.get(key) || null);
        } catch (error) {
          this.logger.error(
            `Error loading store category translations: ${error.message}`,
            error.stack,
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
   * @returns {DataLoader<number, StoreCategory | null>} DataLoader instance
   */
  createStoreCategoryLoader(): DataLoader<number, StoreCategory | null> {
    return new DataLoader<number, StoreCategory | null>(
      async (ids: readonly number[]) => {
        try {
          const storeCategories = await this.prisma.storeCategory.findMany({
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
          this.logger.error(
            `Error loading store categories: ${error.message}`,
            error.stack,
          );
          throw error;
        }
      },
    );
  }

  /**
   * Finds a store category by slug and language
   *
   * @param {string} slug - The store category slug
   * @param {Language} language - The language for translation
   * @returns {Promise<StoreCategory | null>} The store category with its translation
   *
   * @example
   * const cat = await findBySlug('carteras', Language.ES);
   */
  async findBySlug(
    slug: string,
    language: Language,
  ): Promise<StoreCategory | null> {
    try {
      const translation = await this.prisma.storeCategoryTranslation.findUnique(
        {
          where: {
            slug_language: {
              slug,
              language,
            },
          },
          include: {
            storeCategory: true,
          },
        },
      );

      return translation?.storeCategory || null;
    } catch (error) {
      this.logger.error(
        `Error finding store category by slug: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Gets a single translation for a store category using DataLoader
   *
   * @param {DataLoader} loader - The translation DataLoader
   * @param {number} storeCategoryId - The store category ID
   * @param {Language} language - The language for translation
   * @returns {Promise<StoreCategoryTranslation | null>} The translation or null
   */
  async getTranslation(
    loader: DataLoader<string, StoreCategoryTranslation | null>,
    storeCategoryId: number,
    language: Language,
  ): Promise<StoreCategoryTranslation | null> {
    const key = `${storeCategoryId}:${language}`;
    return loader.load(key);
  }

  /**
   * Primes the DataLoader cache with translations for multiple store categories
   * Useful for warming up the cache before resolving nested fields
   *
   * @param {DataLoader} loader - The translation DataLoader
   * @param {number[]} storeCategoryIds - Array of store category IDs
   * @param {Language} language - The language for translations
   * @returns {Promise<void>}
   */
  async primeTranslations(
    loader: DataLoader<string, StoreCategoryTranslation | null>,
    storeCategoryIds: number[],
    language: Language,
  ): Promise<void> {
    const keys = storeCategoryIds.map((id) => `${id}:${language}`);
    await loader.loadMany(keys);
  }

  /**
   * Finds all store categories with pagination
   *
   * @param {number} limit - Maximum number of store categories to return
   * @param {number} offset - Number of store categories to skip
   * @returns {Promise<StoreCategory[]>} Array of store categories
   */
  async findAll(limit: number, offset: number): Promise<StoreCategory[]> {
    try {
      return await this.prisma.storeCategory.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      this.logger.error(
        `Error finding all store categories: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
