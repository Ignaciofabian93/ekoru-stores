# ekoru-stores — GraphQL API Reference

> **Subgraph**: Store catalog — store categories, sub-categories, and store products with stock management.

---

## Headers

| Header | Required | Description |
|---|---|---|
| `Authorization` | Mutations | `Bearer <jwt_token>` |
| `x-seller-id` | Mutations | Seller UUID from auth |
| `Accept-Language` | Optional | `es` · `en` · `fr` — defaults to `es` |

---

## Enums

```graphql
enum Language { ES  EN  FR }

enum Badge {
  POPULAR  DISCOUNTED  WOMAN_OWNED  BEST_SELLER  TOP_RATED
  COMMUNITY_FAVORITE  LIMITED_TIME_OFFER  FLASH_SALE  BEST_VALUE
  HANDMADE  SUSTAINABLE  SUPPORTS_CAUSE  FAMILY_BUSINESS
  CHARITY_SUPPORT  LIMITED_STOCK  SEASONAL  FREE_SHIPPING
  FOR_REPAIR  REFURBISHED  EXCHANGEABLE  LAST_PRICE  FOR_GIFT
  OPEN_TO_OFFERS  OPEN_BOX  CRUELTY_FREE  DELIVERED_TO_HOME
  IN_HOUSE_PICKUP  IN_MID_POINT_PICKUP
}

enum WeightUnit { KG  LB  OZ  G }

enum DimensionUnit { CM  M  IN  FT }

# StoreProductSortInput.field accepts string values:
# price | createdAt | name | averageRating | saleCount | viewCount
```

---

## Fragments

```graphql
fragment StoreCatalogItemFields on StoreCatalogItem {
  id
  name
  slug
  href
  subCategoryItems {
    id
    name
    slug
    href
  }
}

fragment StoreCategoryTranslationFields on StoreCategoryTranslation {
  id
  name
  slug
  href
}

fragment StoreSubCategoryTranslationFields on StoreSubCategoryTranslation {
  id
  name
  slug
  href
}

fragment StoreCategoryFields on StoreCategory {
  id
  translation {
    ...StoreCategoryTranslationFields
  }
  storeSubCategory {
    id
    translation {
      ...StoreSubCategoryTranslationFields
    }
  }
}

fragment StoreSubCategoryFields on StoreSubCategory {
  id
  translation {
    ...StoreSubCategoryTranslationFields
  }
}

fragment EnvironmentalImpactFields on EnvironmentalImpact {
  totalCo2SavingsKG
  totalWaterSavingsLT
  materialBreakdown {
    materialType
    quantity
    unit
    co2SavingsKG
    waterSavingsLT
  }
}

fragment StoreProductFields on StoreProduct {
  id
  name
  description
  stock
  barcode
  sku
  price
  hasOffer
  offerPrice
  images
  badges
  brand
  color
  isActive
  isLowStock
  averageRating
  reviewsNumber
  likesCount
  saleCount
  viewCount
  materialComposition
  recycledContent
  weight
  weightUnit
  length
  width
  height
  dimensionUnit
  lowStockThreshold
  tags
  metaTitle
  metaDescription
  warranty
  warrantyDuration
  features
  sellerId
  createdAt
  updatedAt
}
```

---

## Queries

### getStoreCatalog

Returns the complete store catalog tree (categories → sub-categories) flattened into a simple menu structure. Ideal for navigation menus.

```graphql
query GetStoreCatalog($language: Language = ES) {
  getStoreCatalog(language: $language) {
    ...StoreCatalogItemFields
  }
}
```

**Variables**
```json
{ "language": "ES" }
```

---

### getStoreCategories

```graphql
query GetStoreCategories(
  $limit: Int = 20
  $offset: Int = 0
  $language: Language = ES
) {
  getStoreCategories(limit: $limit, offset: $offset, language: $language) {
    ...StoreCategoryFields
  }
}
```

**Variables**
```json
{ "limit": 20, "offset": 0, "language": "ES" }
```

---

### getStoreCategoryBySlug

```graphql
query GetStoreCategoryBySlug($slug: String!, $language: Language!) {
  getStoreCategoryBySlug(slug: $slug, language: $language) {
    ...StoreCategoryFields
  }
}
```

**Variables**
```json
{ "slug": "electronica", "language": "ES" }
```

---

### getStoreSubCategories

```graphql
query GetStoreSubCategories(
  $limit: Int = 20
  $offset: Int = 0
  $language: Language = ES
) {
  getStoreSubCategories(limit: $limit, offset: $offset, language: $language) {
    ...StoreSubCategoryFields
  }
}
```

**Variables**
```json
{ "limit": 20, "offset": 0, "language": "ES" }
```

---

### getStoreSubCategoryBySlug

```graphql
query GetStoreSubCategoryBySlug($slug: String!, $language: Language) {
  getStoreSubCategoryBySlug(slug: $slug, language: $language) {
    ...StoreSubCategoryFields
  }
}
```

**Variables**
```json
{ "slug": "smartphones", "language": "ES" }
```

---

### getStoreProductById

```graphql
query GetStoreProductById($id: ID!) {
  getStoreProductById(id: $id) {
    ...StoreProductFields
    storeSubCategory {
      id
      translation { name slug href }
    }
    environmentalImpact {
      ...EnvironmentalImpactFields
    }
  }
}
```

**Variables**
```json
{ "id": "42" }
```

---

### getStoreProducts

```graphql
query GetStoreProducts(
  $page: Int = 1
  $pageSize: Int = 10
  $filter: StoreProductFilterInput
  $sort: StoreProductSortInput
) {
  getStoreProducts(page: $page, pageSize: $pageSize, filter: $filter, sort: $sort) {
    nodes {
      ...StoreProductFields
      storeSubCategory {
        id
        translation { name slug href }
      }
    }
    pageInfo {
      totalCount
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

**Variables**
```json
{
  "page": 1,
  "pageSize": 10,
  "filter": {
    "minPrice": 0,
    "maxPrice": 100000,
    "hasOffer": false,
    "isLowStock": false
  },
  "sort": { "field": "createdAt", "order": "desc" }
}
```

---

### getStoreProductsBySeller

```graphql
query GetStoreProductsBySeller(
  $sellerId: ID!
  $page: Int = 1
  $pageSize: Int = 10
  $filter: StoreProductFilterInput
  $sort: StoreProductSortInput
) {
  getStoreProductsBySeller(
    sellerId: $sellerId
    page: $page
    pageSize: $pageSize
    filter: $filter
    sort: $sort
  ) {
    nodes {
      ...StoreProductFields
    }
    pageInfo {
      totalCount
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

**Variables**
```json
{ "sellerId": "seller-uuid-here", "page": 1, "pageSize": 10 }
```

---

### getStoreProductsBySubCategory

```graphql
query GetStoreProductsBySubCategory(
  $subCategoryId: ID!
  $page: Int = 1
  $pageSize: Int = 10
  $filter: StoreProductFilterInput
  $sort: StoreProductSortInput
) {
  getStoreProductsBySubCategory(
    subCategoryId: $subCategoryId
    page: $page
    pageSize: $pageSize
    filter: $filter
    sort: $sort
  ) {
    nodes {
      ...StoreProductFields
    }
    pageInfo {
      totalCount
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

---

### getProductsByStoreCategory

Returns all products from all sub-categories under the given store category.

```graphql
query GetProductsByStoreCategory(
  $categoryId: ID!
  $page: Int = 1
  $pageSize: Int = 10
  $filter: StoreProductFilterInput
  $sort: StoreProductSortInput
) {
  getProductsByStoreCategory(
    categoryId: $categoryId
    page: $page
    pageSize: $pageSize
    filter: $filter
    sort: $sort
  ) {
    nodes {
      ...StoreProductFields
    }
    pageInfo {
      totalCount
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

---

### getProductsOnOffer

```graphql
query GetProductsOnOffer(
  $page: Int = 1
  $pageSize: Int = 10
  $filter: StoreProductFilterInput
  $sort: StoreProductSortInput
) {
  getProductsOnOffer(
    page: $page
    pageSize: $pageSize
    filter: $filter
    sort: $sort
  ) {
    nodes {
      ...StoreProductFields
    }
    pageInfo {
      totalCount
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

---

## Mutations

> All mutations require `Authorization: Bearer <token>` and `x-seller-id` headers.

### addStoreProduct

```graphql
mutation AddStoreProduct($input: AddStoreProductInput!) {
  addStoreProduct(input: $input) {
    ...StoreProductFields
    storeSubCategory {
      id
      translation { name slug href }
    }
  }
}
```

**Variables**
```json
{
  "input": {
    "name": "iPhone 15 Pro",
    "description": "Último modelo Apple con titanio",
    "stock": 25,
    "price": 1200000,
    "images": ["https://cdn.example.com/img1.jpg"],
    "subCategoryId": 5,
    "brand": "Apple",
    "color": "Titanio Natural",
    "badges": ["POPULAR", "BEST_SELLER"],
    "tags": ["iphone", "apple", "smartphone"],
    "hasOffer": false,
    "lowStockThreshold": 5,
    "weight": 0.187,
    "weightUnit": "KG"
  }
}
```

---

### updateStoreProduct

```graphql
mutation UpdateStoreProduct($input: UpdateStoreProductInput!) {
  updateStoreProduct(input: $input) {
    ...StoreProductFields
  }
}
```

**Variables**
```json
{
  "input": {
    "id": 42,
    "price": 1100000,
    "hasOffer": true,
    "offerPrice": 999000,
    "stock": 15
  }
}
```

---

### deleteStoreProduct

```graphql
mutation DeleteStoreProduct($id: ID!) {
  deleteStoreProduct(id: $id) {
    id
    isActive
    deletedAt
  }
}
```

**Variables**
```json
{ "id": "42" }
```

---

### toggleStoreProductActive

```graphql
mutation ToggleStoreProductActive($id: ID!) {
  toggleStoreProductActive(id: $id) {
    id
    isActive
  }
}
```

**Variables**
```json
{ "id": "42" }
```

---

## Input Types

### StoreProductFilterInput

```graphql
input StoreProductFilterInput {
  name: String
  minPrice: Int
  maxPrice: Int
  brand: String
  color: String
  badges: [Badge!]
  hasOffer: Boolean
  isLowStock: Boolean
  subCategoryId: Int
  tags: [String!]
  minRating: Float
}
```

### StoreProductSortInput

```graphql
input StoreProductSortInput {
  field: String!   # price | createdAt | name | averageRating | saleCount | viewCount
  order: String    # asc | desc  (default: desc)
}
```

### AddStoreProductInput

```graphql
input AddStoreProductInput {
  name: String!
  description: String!
  stock: Int!
  barcode: String
  sku: String
  price: Int!
  hasOffer: Boolean
  offerPrice: Int
  images: [String!]!
  badges: [Badge!]
  brand: String
  color: String
  materialComposition: String
  recycledContent: Float
  weight: Float
  weightUnit: WeightUnit
  length: Float
  width: Float
  height: Float
  dimensionUnit: DimensionUnit
  lowStockThreshold: Int
  tags: [String!]
  metaTitle: String
  metaDescription: String
  warranty: Boolean
  warrantyDuration: Int
  features: [String!]
  subCategoryId: Int!
}
```

### UpdateStoreProductInput

```graphql
input UpdateStoreProductInput {
  id: Int!
  name: String
  description: String
  stock: Int
  barcode: String
  sku: String
  price: Int
  hasOffer: Boolean
  offerPrice: Int
  images: [String!]
  isActive: Boolean
  badges: [Badge!]
  brand: String
  color: String
  materialComposition: String
  recycledContent: Float
  weight: Float
  weightUnit: WeightUnit
  length: Float
  width: Float
  height: Float
  dimensionUnit: DimensionUnit
  lowStockThreshold: Int
  tags: [String!]
  metaTitle: String
  metaDescription: String
  warranty: Boolean
  warrantyDuration: Int
  features: [String!]
  subCategoryId: Int
}
```
