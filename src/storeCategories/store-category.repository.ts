import { Injectable, Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import {
  createStoreCategoryTranslationLoader,
  createStoreCategoryByIdLoader,
} from './dataloaders';
import type {
  StoreCategory,
  StoreCategoryTranslation,
} from '../types/store-category';
import type { Language } from '@prisma/client';

/**
 * Store Category Repository - Handles data loading for store categories and their translations
 *
 * This repository implements the DataLoader pattern to efficiently batch and cache
 * database queries for store categories and their translations, preventing N+1 query problems.
 */
@Injectable()
export class StoreCategoryRepository {
  private readonly logger = new Logger(StoreCategoryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a DataLoader for store category translations with composite key (id + language)
   */
  createTranslationLoader(): DataLoader<
    string,
    StoreCategoryTranslation | null
  > {
    return createStoreCategoryTranslationLoader(this.prisma);
  }

  /**
   * Creates a DataLoader for store categories by ID
   */
  createStoreCategoryLoader(): DataLoader<number, StoreCategory | null> {
    return createStoreCategoryByIdLoader(this.prisma);
  }

  /**
   * Finds a store category by slug and language (web browsing)
   *
   * @example
   * const storeCategory = await findBySlug('moda', Language.ES);
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
      const err = error as Error;
      this.logger.error(
        `Error finding store category by slug: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Finds a store category by its ID (admin panel)
   */
  async findById(id: number): Promise<StoreCategory | null> {
    try {
      return await this.prisma.storeCategory.findUnique({
        where: { id },
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error finding store category by id: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Finds all active store categories with page-based pagination
   *
   * @param {number} page - 1-based page number
   * @param {number} pageSize - Number of store categories per page
   */
  async findAll(page: number, pageSize: number): Promise<StoreCategory[]> {
    try {
      return await this.prisma.storeCategory.findMany({
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
        `Error finding all store categories: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Gets a single translation for a store category using DataLoader
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
   */
  async primeTranslations(
    loader: DataLoader<string, StoreCategoryTranslation | null>,
    storeCategoryIds: number[],
    language: Language,
  ): Promise<void> {
    const keys = storeCategoryIds.map((id) => `${id}:${language}`);
    await loader.loadMany(keys);
  }
}
