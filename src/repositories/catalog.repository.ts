import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { StoreCategoryTranslation } from '../types/store-category';
import DataLoader from 'dataloader';
import { Language } from '@prisma/client';

@Injectable()
export class CatalogRepository {
  private readonly logger = new Logger(CatalogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a DataLoader for department translations with composite key (id + language)
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

          const translation =
            await this.prisma.storeCategoryTranslation.findMany({
              where: {
                OR: keyPairs.map(({ storeCategoryId, language }) => ({
                  storeCategoryId,
                  language,
                })),
              },
            });

          const translationMap = new Map<string, StoreCategoryTranslation>();
          translation.forEach((translation) => {
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
   * Gets the complete marketplace catalog with translations
   * Returns departments with their categories and product categories
   * All filtered by the specified language
   */
  async getStoreCatalog(language: Language) {
    try {
      const stores = await this.prisma.storeCategory.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
        include: {
          translations: {
            where: {
              language: language,
            },
            select: {
              id: true,
              name: true,
              slug: true,
              href: true,
            },
          },
          storeSubCategory: {
            where: {
              isActive: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
            include: {
              translations: {
                where: {
                  language: language,
                },
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  href: true,
                },
              },
            },
          },
        },
      });

      return stores.map((store) => ({
        id: store.id,
        name: store.translations[0]?.name || '',
        slug: store.translations[0]?.slug || '',
        href: store.translations[0]?.href || '',
        subCategories: store.storeSubCategory.map((subCategory) => ({
          id: subCategory.id,
          name: subCategory.translations[0]?.name || '',
          slug: subCategory.translations[0]?.slug || '',
          href: subCategory.translations[0]?.href || '',
        })),
      }));
    } catch (error) {
      this.logger.error(
        `Error getting store catalog: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
