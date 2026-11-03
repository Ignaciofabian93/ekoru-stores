import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { I18nService } from '../common/i18n';
import { BusinessProductsService } from './business-products.service';
import { BusinessProductsResolver } from './business-products.resolver';

/**
 * Business-facing publishing from the panel (ADM-16). Separate from
 * AdminStoreProductModule, which is EKORU's own whole-catalog tool: this one
 * only ever writes the caller's store, with the web's publishing rules
 * (ProductsService).
 */
@Module({
  imports: [PrismaModule, ProductsModule],
  providers: [I18nService, BusinessProductsService, BusinessProductsResolver],
})
export class BusinessProductsModule {}
