import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsService } from './products.service';
import { ProductsResolver, SellerReferenceResolver } from './products.resolver';
import { ImpactService } from '../services/impact.service';
import { MaterialService } from '../services/material.service';
import { MaterialResolver } from '../resolvers/material.resolver';
import { ImpactRepository } from '../repositories/impact.repository';
import { I18nService } from '../common/i18n';
import { StockService } from './stock/stock.service';
import { StockResolver } from './stock/stock.resolver';

/**
 * Products Module
 *
 * This module handles all store product-related functionality including:
 * - Store product CRUD operations
 * - Product queries by seller, store category, store subcategory
 * - Product filtering and sorting
 * - Products on offer/sale
 * - Environmental impact calculations
 */
@Module({
  imports: [PrismaModule],
  providers: [
    I18nService,
    ProductsService,
    ProductsResolver,
    SellerReferenceResolver,
    ImpactService,
    MaterialService,
    MaterialResolver,
    ImpactRepository,
    StockService,
    StockResolver,
  ],
  exports: [ProductsService, ImpactService, MaterialService],
})
export class ProductsModule {}
