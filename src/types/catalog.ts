export type StoreCatalog = {
  id: number;
  name: string;
  href: string;
  subCategoryItems: {
    id: number;
    name: string;
    href: string;
  }[];
}[];
