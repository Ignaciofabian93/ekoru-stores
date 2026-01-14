import { Injectable, Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import type {
  StoreSubCategory,
  StoreSubCategoryTranslation,
} from '../types/store-sub-category';
import type { Language } from '@prisma/client';

@Injectable()
export class StoreSubCategoryRepository {
  private readonly logger = new Logger(StoreSubCategoryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a DataLoader for product category translations with composite key (id + language)
   *
   * @returns {DataLoader<string, StoreSubCategoryTranslation | null>} DataLoader instance
   *
   * @example
   * const loader = createTranslationLoader();
   * const translation = await loader.load('1:ES');
   */
  createTranslationLoader(): DataLoader<
    string,
    StoreSubCategoryTranslation | null
  > {
    return new DataLoader<string, StoreSubCategoryTranslation | null>(
      async (compositeKeys: readonly string[]) => {
        try {
          const keyPairs = compositeKeys.map((key) => {
            const [idStr, language] = key.split(':');
            return {
              storeSubCategoryId: parseInt(idStr, 10),
              language: language as Language,
            };
          });

          const translations =
            await this.prisma.storeSubCategoryTranslation.findMany({
              where: {
                OR: keyPairs.map(({ storeSubCategoryId, language }) => ({
                  storeSubCategoryId,
                  language,
                })),
              },
            });
          const translationMap = new Map<string, StoreSubCategoryTranslation>();
          translations.forEach((translation) => {
            const key = `${translation.storeSubCategoryId}:${translation.language}`;
            translationMap.set(key, translation);
          });

          return compositeKeys.map((key) => translationMap.get(key) || null);
        } catch (error) {
          this.logger.error(
            `Error loading store sub-category translations: ${error.message}`,
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
   * Creates a DataLoader for store sub-categories by store category ID
   *
   * @returns {DataLoader<number, StoreSubCategory[]>} DataLoader instance
   *
   * @example
   * const loader = createStoreSubCategoryByCategoryLoader();
   * const storeSubCategories = await loader.load(1);
   */
  createStoreSubCategoryByCategoryLoader(): DataLoader<
    number,
    StoreSubCategory[]
  > {
    return new DataLoader<number, StoreSubCategory[]>(
      async (storeCategoryIds: readonly number[]) => {
        try {
          const subCategories = await this.prisma.storeSubCategory.findMany({
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

          const subCategoryMap = new Map<number, StoreSubCategory[]>();
          subCategories.forEach((subCategory) => {
            const existing =
              subCategoryMap.get(subCategory.storeCategoryId) || [];
            subCategoryMap.set(subCategory.storeCategoryId, [
              ...existing,
              subCategory,
            ]);
          });

          return storeCategoryIds.map((id) => subCategoryMap.get(id) || []);
        } catch (error) {
          this.logger.error(
            `Error loading store sub-categories by category IDs: ${error.message}`,
            error.stack,
          );
          throw error;
        }
      },
    );
  }

  /**
   * Finds a store sub-category by slug and language
   *
   * @param {string} slug - The store sub-category slug
   * @param {Language} language - The language for translation
   * @returns {Promise<StoreSubCategory | null>} The store sub-category with its translation
   *
   * @example
   * const dept = await findBySlug('led-grande', Language.ES);
   */
  async findBySlug(
    slug: string,
    language: Language,
  ): Promise<StoreSubCategory | null> {
    try {
      const translation =
        await this.prisma.storeSubCategoryTranslation.findFirst({
          where: {
            slug,
            language,
          },
          include: {
            storeSubCategory: true,
          },
        });

      return translation?.storeSubCategory || null;
    } catch (error) {
      this.logger.error(
        `Error finding store sub-category by slug: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Finds all store sub categories with pagination
   *
   * @param {number} limit - Maximum number of store sub categories to return
   * @param {number} offset - Number of store sub categories to skip
   * @returns {Promise<StoreSubCategory[]>} Array of store sub categories
   */
  async findAll(limit: number, offset: number): Promise<StoreSubCategory[]> {
    try {
      return await this.prisma.storeSubCategory.findMany({
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
        `Error finding all store sub-categories: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Finds all store sub categories for a specific category
   *
   * @param {number} storeCategoryId - The store category ID
   * @returns {Promise<StoreSubCategory[]>} Array of store sub categories
   */
  async findByStoreCategoryId(
    storeCategoryId: number,
  ): Promise<StoreSubCategory[]> {
    try {
      return await this.prisma.storeSubCategory.findMany({
        where: {
          storeCategoryId,
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });
    } catch (error) {
      this.logger.error(
        `Error finding store sub-categories by category ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Gets a single translation for a store sub category using DataLoader
   *
   * @param {DataLoader} loader - The translation DataLoader
   * @param {storeCategoryId} storeCategoryId - The store category ID
   * @param {Language} language - The language for translation
   * @returns {Promise<StoreSubCategoryTranslation | null>} The translation or null
   */
  async getTranslation(
    loader: DataLoader<string, StoreSubCategoryTranslation | null>,
    storeSubCategoryId: number,
    language: Language,
  ): Promise<StoreSubCategoryTranslation | null> {
    const key = `${storeSubCategoryId}:${language}`;
    return loader.load(key);
  }

  /**
   * Primes the DataLoader cache with translations for multiple store sub categories
   *
   * @param {DataLoader} loader - The translation DataLoader
   * @param {number[]} storeSubCategoryIds - Array of store sub category IDs
   * @param {Language} language - The language for translations
   * @returns {Promise<void>}
   */
  async primeTranslations(
    loader: DataLoader<string, StoreSubCategoryTranslation | null>,
    storeSubCategoryIds: number[],
    language: Language,
  ): Promise<void> {
    const keys = storeSubCategoryIds.map((id) => `${id}:${language}`);
    await loader.loadMany(keys);
  }
}
