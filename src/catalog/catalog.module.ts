import { Module } from '@nestjs/common';
import { StoreCatalogService } from './catalog.service';
import { StoreCatalogResolver } from './catalog.resolver';

@Module({
  providers: [StoreCatalogService, StoreCatalogResolver],
  exports: [StoreCatalogService],
})
export class StoreCatalogModule {}
