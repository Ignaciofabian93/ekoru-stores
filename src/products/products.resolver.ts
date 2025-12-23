import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { ImpactService } from '../impact/impact.service';
import { CurrentSeller } from '../common/decorators';
import {
  StoreProduct,
  StoreProductConnection,
  StoreSubCategory,
  ProductVariant,
  EnvironmentalImpact,
  Seller,
} from '../catalog/entities';
import {
  AddProductInput,
  UpdateProductInput,
  ProductFilterInput,
  ProductSortInput,
} from './dto';

@Resolver(() => StoreProduct)
export class ProductsResolver {
  constructor(
    private readonly productsService: ProductsService,
    private readonly impactService: ImpactService,
  ) {}

  @Query(() => StoreProduct, { nullable: true, name: 'getProductById' })
  async getProductById(@Args('id', { type: () => ID }) id: string) {
    return this.productsService.getProductById(Number(id));
  }

  @Query(() => StoreProductConnection, { nullable: true, name: 'getProducts' })
  async getProducts(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getProducts(page, pageSize, filter, sort);
  }

  @Query(() => StoreProductConnection, {
    nullable: true,
    name: 'getProductsBySeller',
  })
  async getProductsBySeller(
    @Args('sellerId', { type: () => ID }) sellerId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getProductsBySeller(
      sellerId,
      page,
      pageSize,
      filter,
      sort,
    );
  }

  @Query(() => StoreProductConnection, {
    nullable: true,
    name: 'getProductsBySubcategory',
  })
  async getProductsBySubcategory(
    @Args('subcategoryId', { type: () => ID }) subcategoryId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getProductsBySubcategory(
      Number(subcategoryId),
      page,
      pageSize,
      filter,
      sort,
    );
  }

  @Query(() => StoreProductConnection, {
    nullable: true,
    name: 'getProductsOnOffer',
  })
  async getProductsOnOffer(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getProductsOnOffer(
      page,
      pageSize,
      filter,
      sort,
    );
  }

  @Mutation(() => StoreProduct, { nullable: true, name: 'addProduct' })
  async addProduct(
    @Args('input') input: AddProductInput,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.productsService.addProduct(input, sellerId);
  }

  @Mutation(() => StoreProduct, { nullable: true, name: 'updateProduct' })
  async updateProduct(
    @Args('input') input: UpdateProductInput,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.productsService.updateProduct(input, sellerId);
  }

  @Mutation(() => StoreProduct, { nullable: true, name: 'deleteProduct' })
  async deleteProduct(@Args('id', { type: () => ID }) id: string) {
    return this.productsService.deleteProduct(Number(id));
  }

  @Mutation(() => StoreProduct, { nullable: true, name: 'toggleProductActive' })
  async toggleProductActive(
    @Args('id', { type: () => ID }) id: string,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.productsService.toggleProductActive(Number(id), sellerId);
  }

  // Field resolvers
  @ResolveField(() => StoreSubCategory, { nullable: true })
  storeSubCategory(@Parent() product: StoreProduct) {
    if (product.storeSubCategory) {
      return product.storeSubCategory;
    }
    return null;
  }

  @ResolveField(() => [ProductVariant], { nullable: true })
  productVariants(@Parent() product: StoreProduct) {
    if (product.productVariants) {
      return product.productVariants;
    }
    return [];
  }

  @ResolveField(() => Seller, { nullable: true })
  seller(@Parent() product: StoreProduct) {
    if (product.seller) {
      return product.seller;
    }
    // Return a reference for Apollo Federation
    return { __typename: 'Seller', id: product.sellerId };
  }

  @ResolveField(() => EnvironmentalImpact, { nullable: true })
  async environmentalImpact(@Parent() product: StoreProduct) {
    try {
      // Calculate impact based on subcategory materials
      if (!product.subcategoryId) return null;

      return await this.impactService.calculateSubcategoryImpact(
        product.subcategoryId,
      );
    } catch (error) {
      console.error('Error calculating environmental impact:', error);
      return null;
    }
  }
}
