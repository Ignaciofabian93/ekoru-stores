export type StoreCatalog = {
  id: number;
  name: string;
  href: string;
  subCategories: {
    id: number;
    name: string;
    href: string;
  }[];
}[];
