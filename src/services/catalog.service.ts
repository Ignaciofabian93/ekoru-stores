import { Injectable, Logger } from '@nestjs/common';
import { Language } from '../graphql/enums';
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
    const lang = language ?? this.i18nService.getDefaultLanguage();

    this.logger.debug(`Fetching store catalog for language: ${lang}`);

    return this.catalogRepository.getStoreCatalog(lang);
  }
}
