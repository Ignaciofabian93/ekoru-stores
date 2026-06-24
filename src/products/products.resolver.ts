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
} from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { CurrentSeller, CurrentAdmin } from '../common/decorators';
import { StoreSubCategoryEntity } from '../catalog-v2/entities';
import { ProductEntity, SellerEntity } from './entities/product.entity';
import { ProductConnectionEntity } from './entities/product-connection.entity';
import { EnvironmentalImpactEntity } from './entities/environmental-impact.entity';
import { ProductsService } from './products.service';
import { ImpactService } from '../services/impact.service';
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
    @Args('filter', { type: () => StoreProductFilterInput, nullable: true })
    filter?: StoreProductFilterInput,
    @Args('sort', { type: () => StoreProductSortInput, nullable: true })
    sort?: StoreProductSortInput,
  ) {
    return this.productsService.getProducts({ page, pageSize, filter, sort });
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
    });
  }

  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getProductsOnOffer',
  })
  async getProductsOnOffer(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
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

  // Field resolvers
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

  @ResolveField(() => EnvironmentalImpactEntity, { nullable: true })
  async environmentalImpact(@Parent() product: ProductEntity) {
    try {
      // For StoreProduct, we calculate impact based on the subcategory's materials
      // We need to get the subCategoryId from the product
      // If storeSubCategory is loaded, use its id, otherwise the product should have subCategoryId
      const subCategoryId = product.storeSubCategory?.id;

      if (!subCategoryId) {
        return null;
      }

      return await this.impactService.calculateSubCategoryImpact(subCategoryId);
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
