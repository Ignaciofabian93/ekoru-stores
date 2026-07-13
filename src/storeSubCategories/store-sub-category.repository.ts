import { Injectable, Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import {
  createStoreSubCategoryTranslationLoader,
  createStoreSubCategoriesByStoreCategoryLoader,
} from './dataloaders';
import type {
  StoreSubCategory,
  StoreSubCategoryTranslation,
} from '../types/store-sub-category';
import type { Language } from '@prisma/client';

/**
 * Store Sub Category Repository - Handles data loading for store sub categories and their translations
 *
 * This repository implements the DataLoader pattern to efficiently batch and cache
 * database queries for store sub categories and their translations.
 */
@Injectable()
export class StoreSubCategoryRepository {
  private readonly logger = new Logger(StoreSubCategoryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a DataLoader for store sub category translations with composite key (id + language)
   */
  createTranslationLoader(): DataLoader<
    string,
    StoreSubCategoryTranslation | null
  > {
    return createStoreSubCategoryTranslationLoader(this.prisma);
  }

  /**
   * Creates a DataLoader for store sub categories by store category ID
   */
  createStoreSubCategoryByCategoryLoader(): DataLoader<
    number,
    StoreSubCategory[]
  > {
    return createStoreSubCategoriesByStoreCategoryLoader(this.prisma);
  }

  /**
   * Finds a store sub category by slug and language
   *
   * @example
   * const subCategory = await findBySlug('carteras', Language.ES);
   */
  async findBySlug(
    slug: string,
    language: Language,
  ): Promise<StoreSubCategory | null> {
    try {
      const translation =
        await this.prisma.storeSubCategoryTranslation.findUnique({
          where: {
            slug_language: {
              slug,
              language,
            },
          },
          include: {
            storeSubCategory: true,
          },
        });

      return translation?.storeSubCategory || null;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error finding store sub category by slug: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Finds a store sub category by its ID
   */
  async findById(id: number): Promise<StoreSubCategory | null> {
    try {
      return await this.prisma.storeSubCategory.findUnique({
        where: { id },
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error finding store sub category by id: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Finds all active store sub categories with page-based pagination
   *
   * @param {number} page - 1-based page number
   * @param {number} pageSize - Number of store sub categories per page
   */
  async findAll(page: number, pageSize: number): Promise<StoreSubCategory[]> {
    try {
      return await this.prisma.storeSubCategory.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error finding all store sub categories: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Finds all store sub categories for a specific store category
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
      const err = error as Error;
      this.logger.error(
        `Error finding store sub categories by store category: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Gets a single translation for a store sub category using DataLoader
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
