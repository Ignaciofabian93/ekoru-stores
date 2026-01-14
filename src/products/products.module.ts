import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsService } from './products.service';
import { ProductsResolver, SellerReferenceResolver } from './products.resolver';
import { ImpactService } from '../services/impact.service';
import { ImpactRepository } from '../repositories/impact.repository';

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
    ProductsService,
    ProductsResolver,
    SellerReferenceResolver,
    ImpactService,
    ImpactRepository,
  ],
  exports: [ProductsService, ImpactService],
})
export class ProductsModule {}
