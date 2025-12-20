import { Resolver, Query, Args, ID, Int } from '@nestjs/graphql';
import { StoreService } from './store.service';
import { StoreCategory, StoreSubCategory } from '../catalog/entities';
import { StoreSubCategoryConnection } from './entities/store-subcategory-connection.entity';

@Resolver()
export class StoreResolver {
  constructor(private readonly storeService: StoreService) {}

  @Query(() => [StoreCategory], { nullable: true, name: 'getStoreCategories' })
  async getStoreCategories() {
    return this.storeService.getStoreCategories();
  }

  @Query(() => [StoreSubCategory], {
    nullable: true,
    name: 'getStoreSubCategoriesByCategoryId',
  })
  async getStoreSubCategoriesByCategoryId(
    @Args('storeCategoryId', { type: () => ID }) storeCategoryId: string,
  ) {
    return this.storeService.getStoreSubCategoriesByCategoryId(
      Number(storeCategoryId),
    );
  }

  @Query(() => StoreCategory, { nullable: true, name: 'getStoreCategory' })
  async getStoreCategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
  ) {
    return this.storeService.getStoreCategory(Number(id), page, pageSize);
  }

  @Query(() => StoreSubCategory, {
    nullable: true,
    name: 'getStoreSubCategory',
  })
  async getStoreSubCategory(@Args('id', { type: () => ID }) id: string) {
    return this.storeService.getStoreSubCategory(Number(id));
  }

  @Query(() => StoreSubCategoryConnection, {
    nullable: true,
    name: 'getStoreSubCategories',
  })
  async getStoreSubCategories(
    @Args('storeCategoryId', { type: () => ID }) storeCategoryId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
  ) {
    return this.storeService.getStoreSubCategories(
      Number(storeCategoryId),
      page,
      pageSize,
    );
  }
}
