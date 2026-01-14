import { ProductCategoryMaterial } from './product';
import { StoreProductMaterial } from './store-sub-category';

export type WaterImpactMessage = {
  id: number;
  min: number;
  max: number;
  message1: string;
  message2: string;
  message3: string;
};

export type Co2ImpactMessage = {
  id: number;
  min: number;
  max: number;
  message1: string;
  message2: string;
  message3: string;
};

export type MaterialImpactEstimate = {
  id: number;
  materialType: string;
  estimatedCo2SavingsKG: number;
  estimatedWaterSavingsLT: number;
  productCategoryMaterials: ProductCategoryMaterial[];
  storeProductMaterials: StoreProductMaterial[];
};
