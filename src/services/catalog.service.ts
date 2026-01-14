import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Language } from '@prisma/client';
import { I18nService } from '../common/i18n';
import { CatalogRepository } from '../repositories/catalog.repository';
import { StoreCatalog } from '../types/catalog';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly catalogRepository: CatalogRepository,
    private readonly i18nService: I18nService,
  ) {}

  async getStoreCatalog(language?: Language): Promise<StoreCatalog> {
    const lang = language || this.i18nService.getCurrentLanguage();

    this.logger.debug(`Fetching store catalog for language: ${lang}`);

    const catalog = await this.catalogRepository.getStoreCatalog(lang);

    if (!catalog || catalog.length === 0) {
      throw new NotFoundException(
        `Store catalog not found for language '${lang}'`,
      );
    }

    return catalog;
  }
}
