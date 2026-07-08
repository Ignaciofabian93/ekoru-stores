import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  ResolveField,
  ResolveReference,
  Parent,
  Context,
} from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { CurrentSeller, CurrentAdmin } from '../common/decorators';
import type { GraphQLContext } from '../types';
import { StoreSubCategoryEntity } from '../catalog-v2/entities';
import { ProductEntity, SellerEntity } from './entities/product.entity';
import { ProductConnectionEntity } from './entities/product-connection.entity';
import { EnvironmentalImpactEntity } from './entities/environmental-impact.entity';
import { StoreProductMaterialCompositionEntity } from './entities/store-product-material-composition.entity';
import { ProductsService } from './products.service';
import { ImpactService } from '../services/impact.service';
import { MaterialService } from '../services/material.service';
import {
  StoreProductFilterInput,
  StoreProductSortInput,
  AddStoreProductInput,
  UpdateStoreProductInput,
} from './dto/product.input';

@Resolver(() => ProductEntity)
export class ProductsResolver {
  private readonly logger = new Logger(ProductsResolver.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly impactService: ImpactService,
    private readonly materialService: MaterialService,
  ) {}

  @Query(() => ProductEntity, { nullable: true, name: 'getStoreProductById' })
  async getProductById(@Args('id', { type: () => ID }) id: string) {
    return this.productsService.getProductById(Number(id));
  }

  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getStoreProducts',
  })
  async getProducts(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @CurrentSeller() currentSellerId?: string,
    @Args('filter', { type: () => StoreProductFilterInput, nullable: true })
    filter?: StoreProductFilterInput,
    @Args('sort', { type: () => StoreProductSortInput, nullable: true })
    sort?: StoreProductSortInput,
  ) {
    return this.productsService.getProducts({
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId: currentSellerId,
    });
  }

  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getStoreProductsBySeller',
  })
  async getProductsBySeller(
    @Args('sellerId', { type: () => ID }) sellerId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @Args('filter', { type: () => StoreProductFilterInput, nullable: true })
    filter?: StoreProductFilterInput,
    @Args('sort', { type: () => StoreProductSortInput, nullable: true })
    sort?: StoreProductSortInput,
  ) {
    return this.productsService.getProductsBySeller({
      sellerId,
      page,
      pageSize,
      filter,
      sort,
    });
  }

  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getStoreProductsBySubCategory',
  })
  async getProductsBySubCategory(
    @Args('subCategoryId', { type: () => ID }) subCategoryId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @CurrentSeller() currentSellerId?: string,
    @Args('filter', { type: () => StoreProductFilterInput, nullable: true })
    filter?: StoreProductFilterInput,
    @Args('sort', { type: () => StoreProductSortInput, nullable: true })
    sort?: StoreProductSortInput,
  ) {
    return this.productsService.getProductsBySubCategory({
      subCategoryId: Number(subCategoryId),
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId: currentSellerId,
    });
  }

  /**
   * Get products by Store Category
   * Returns all products from all subcategories under this store category
   * Example: "Electronics" store category → phones, tablets, laptops, etc.
   */
  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getProductsByStoreCategory',
  })
  async getProductsByStoreCategory(
    @Args('categoryId', { type: () => ID })
    categoryId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @CurrentSeller() currentSellerId?: string,
    @Args('filter', { type: () => StoreProductFilterInput, nullable: true })
    filter?: StoreProductFilterInput,
    @Args('sort', { type: () => StoreProductSortInput, nullable: true })
    sort?: StoreProductSortInput,
  ) {
    return this.productsService.getProductsByStoreCategory({
      categoryId: Number(categoryId),
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId: currentSellerId,
    });
  }

  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getProductsOnOffer',
  })
  async getProductsOnOffer(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @CurrentSeller() currentSellerId?: string,
    @Args('filter', { type: () => StoreProductFilterInput, nullable: true })
    filter?: StoreProductFilterInput,
    @Args('sort', { type: () => StoreProductSortInput, nullable: true })
    sort?: StoreProductSortInput,
  ) {
    return this.productsService.getProductsOnOffer({
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId: currentSellerId,
    });
  }

  @Mutation(() => ProductEntity, { nullable: true, name: 'addStoreProduct' })
  async addProduct(
    @Args('input') input: AddStoreProductInput,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.productsService.addProduct({ input, sellerId });
  }

  @Mutation(() => ProductEntity, { nullable: true, name: 'updateStoreProduct' })
  async updateProduct(
    @Args('input') input: UpdateStoreProductInput,
    @CurrentSeller() sellerId?: string,
    @CurrentAdmin() adminId?: string,
  ) {
    return this.productsService.updateProduct({ input, sellerId, adminId });
  }

  @Mutation(() => ProductEntity, { nullable: true, name: 'deleteStoreProduct' })
  async deleteProduct(
    @Args('id', { type: () => ID }) id: string,
    @CurrentSeller() sellerId?: string,
    @CurrentAdmin() adminId?: string,
  ) {
    return this.productsService.deleteProduct({
      id: Number(id),
      sellerId,
      adminId,
    });
  }

  @Mutation(() => ProductEntity, {
    nullable: true,
    name: 'toggleStoreProductActive',
  })
  async toggleProductActive(
    @Args('id', { type: () => ID }) id: string,
    @CurrentSeller() sellerId?: string,
    @CurrentAdmin() adminId?: string,
  ) {
    return this.productsService.toggleProductActive({
      id: Number(id),
      sellerId,
      adminId,
    });
  }

  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getMyFavoriteStoreProducts',
    description: "The current seller's favorited store products (paginated).",
  })
  async getMyFavoriteStoreProducts(
    @CurrentSeller() sellerId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 12 }) pageSize: number,
  ) {
    return this.productsService.getMyFavorites({ sellerId, page, pageSize });
  }

  @Mutation(() => ProductEntity, {
    nullable: true,
    name: 'toggleStoreProductLike',
  })
  async toggleStoreProductLike(
    @Args('storeProductId', { type: () => ID }) storeProductId: string,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.productsService.toggleProductLike({
      storeProductId: Number(storeProductId),
      sellerId,
    });
  }

  // Field resolvers
  @ResolveField(() => Boolean, {
    description: 'Whether the current seller has favorited this store product',
  })
  async isLiked(
    @Parent() product: ProductEntity,
    @Context() ctx: GraphQLContext,
  ): Promise<boolean> {
    return ctx.loaders.storeProductLikedByMe.load(product.id);
  }

  @ResolveField(() => StoreSubCategoryEntity, { nullable: true })
  storeSubCategory(@Parent() product: ProductEntity) {
    if (product.storeSubCategory) {
      return product.storeSubCategory;
    }
    return null;
  }

  @ResolveField(() => SellerEntity, { nullable: true })
  seller(@Parent() product: ProductEntity) {
    if (product.seller) {
      return product.seller;
    }
    // Return a reference for Apollo Federation
    return { __typename: 'Seller', id: product.sellerId };
  }

  @ResolveField(() => [StoreProductMaterialCompositionEntity], {
    description: "The product's declared material composition, localized.",
  })
  async materials(
    @Parent() product: ProductEntity,
    @Context() ctx: GraphQLContext,
  ): Promise<StoreProductMaterialCompositionEntity[]> {
    return this.materialService.getProductComposition(product.id, ctx.language);
  }

  @ResolveField(() => EnvironmentalImpactEntity, { nullable: true })
  async environmentalImpact(
    @Parent() product: ProductEntity,
    @Context() ctx: GraphQLContext,
  ) {
    try {
      // Impact is derived from the product's own declared material composition
      // (StoreProductMaterialComposition), since two sellers can list the same
      // kind of product with different materials.
      return await this.impactService.calculateProductImpact(
        product.id,
        ctx.language,
      );
    } catch (error) {
      this.logger.error('Error calculating environmental impact:', error);
      return null;
    }
  }
}

/**
 * Seller Reference Resolver for Apollo Federation
 * This allows the gateway to resolve Seller entities from the users subgraph
 */
@Resolver(() => SellerEntity)
export class SellerReferenceResolver {
  @ResolveReference()
  resolveReference(reference: { __typename: string; id: string }) {
    // Return the reference as-is. The users subgraph will resolve the full entity
    return reference;
  }
}
