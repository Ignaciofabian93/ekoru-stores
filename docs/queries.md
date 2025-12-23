# Ekoru Stores Subgraph - GraphQL API Reference

Complete reference for all available queries and mutations in the Ekoru Stores subgraph.

## 📋 Table of Contents

- [Authentication](#authentication)
- [Products Module](#products-module)
- [Store Categories Module](#store-categories-module)
- [Catalog Module](#catalog-module)
- [Impact Module](#impact-module)
- [Response Types](#response-types)
- [Usage Examples](#usage-examples)

---

## 🔐 Authentication

All mutations and seller-specific queries require authentication via headers:

```typescript
headers: {
  'x-seller-id': 'seller-uuid',
  'authorization': 'Bearer your-jwt-token'
}
```

---

## 🛍️ Products Module

### Queries

#### 1. Get Product by ID

Retrieve a single store product by its ID.

```graphql
query GetProductById($id: ID!) {
  getProductById(id: $id) {
    id
    name
    description
    price
    stock
    barcode
    sku
    hasOffer
    offerPrice
    images
    isActive
    badges
    brand
    color
    ratingCount
    ratings
    reviewsNumber
    materialComposition
    recycledContent
    sustainabilityScore
    carbonFootprint
    createdAt
    updatedAt
    storeSubCategory {
      id
      subCategory
      storeCategory {
        id
        category
      }
    }
    productVariants {
      id
      name
      price
      stock
      color
      size
    }
    seller {
      id
      email
      sellerType
    }
  }
}
```

**Variables:**

```json
{
  "id": "1"
}
```

---

#### 2. Get All Products (Paginated)

Get a paginated list of all store products with optional filtering and sorting.

```graphql
query GetProducts(
  $page: Int!
  $pageSize: Int!
  $filter: ProductFilterInput
  $sort: ProductSortInput
) {
  getProducts(page: $page, pageSize: $pageSize, filter: $filter, sort: $sort) {
    nodes {
      id
      name
      description
      price
      stock
      images
      hasOffer
      offerPrice
      isActive
      brand
      color
      ratings
      sustainabilityScore
      subcategoryId
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

**Variables:**

```json
{
  "page": 1,
  "pageSize": 20,
  "filter": {
    "name": "Bag",
    "minPrice": 1000,
    "maxPrice": 10000,
    "isActive": true,
    "subcategoryId": 5,
    "brand": "EcoStore",
    "hasOffer": true,
    "minStock": 1,
    "minRating": 4.0,
    "minRecycledContent": 50,
    "minSustainabilityScore": 80,
    "badges": ["SUSTAINABLE", "HANDMADE"]
  },
  "sort": {
    "field": "PRICE",
    "order": "ASC"
  }
}
```

**Available Filter Options:**

- `name` - String (case-insensitive search)
- `minPrice`, `maxPrice` - Integer
- `isActive` - Boolean
- `sellerId` - String
- `subcategoryId` - Integer
- `storeCategoryId` - Integer
- `brand`, `color` - String (case-insensitive)
- `badges` - Array of Badge enum
- `hasOffer` - Boolean
- `minStock` - Integer
- `minRating` - Float
- `minRecycledContent` - Float (percentage)
- `minSustainabilityScore` - Integer (0-100)

**Available Sort Fields:**

- `CREATED_AT` - Sort by creation date
- `PRICE` - Sort by price
- `NAME` - Sort alphabetically
- `RATING` - Sort by rating
- `STOCK` - Sort by stock quantity

**Sort Orders:**

- `ASC` - Ascending
- `DESC` - Descending

---

#### 3. Get Products by Seller

Get all products from a specific seller.

```graphql
query GetProductsBySeller($sellerId: ID!, $page: Int!, $pageSize: Int!) {
  getProductsBySeller(sellerId: $sellerId, page: $page, pageSize: $pageSize) {
    nodes {
      id
      name
      price
      stock
      isActive
      images
    }
    pageInfo {
      totalCount
      currentPage
      hasNextPage
    }
  }
}
```

**Variables:**

```json
{
  "sellerId": "seller-uuid-123",
  "page": 1,
  "pageSize": 20
}
```

---

#### 4. Get Products by Subcategory

Get all products in a specific subcategory.

```graphql
query GetProductsBySubcategory(
  $subcategoryId: ID!
  $page: Int!
  $pageSize: Int!
) {
  getProductsBySubcategory(
    subcategoryId: $subcategoryId
    page: $page
    pageSize: $pageSize
  ) {
    nodes {
      id
      name
      price
      images
      sustainabilityScore
      recycledContent
    }
    pageInfo {
      totalCount
    }
  }
}
```

**Variables:**

```json
{
  "subcategoryId": "5",
  "page": 1,
  "pageSize": 20
}
```

---

#### 5. Get Products on Offer

Get all active products that have offers.

```graphql
query GetProductsOnOffer($page: Int!, $pageSize: Int!) {
  getProductsOnOffer(page: $page, pageSize: $pageSize) {
    nodes {
      id
      name
      price
      offerPrice
      hasOffer
      images
      stock
    }
    pageInfo {
      totalCount
    }
  }
}
```

**Variables:**

```json
{
  "page": 1,
  "pageSize": 20
}
```

---

#### 6. Search Products

Search products by name, description, brand, or material composition.

```graphql
query SearchProducts($searchTerm: String!, $page: Int!, $pageSize: Int!) {
  searchProducts(searchTerm: $searchTerm, page: $page, pageSize: $pageSize) {
    nodes {
      id
      name
      description
      price
      images
      brand
      materialComposition
    }
    pageInfo {
      totalCount
    }
  }
}
```

**Variables:**

```json
{
  "searchTerm": "recycled cotton",
  "page": 1,
  "pageSize": 20
}
```

---

### Mutations

#### 1. Add Product

Create a new store product. **Requires authentication.**

```graphql
mutation AddProduct($input: AddProductInput!) {
  addProduct(input: $input) {
    id
    name
    price
    stock
    isActive
    createdAt
  }
}
```

**Variables:**

```json
{
  "input": {
    "name": "Upcycled Bag",
    "description": "Handmade bag from recycled materials",
    "stock": 10,
    "price": 5000,
    "images": ["image1.jpg", "image2.jpg"],
    "subcategoryId": 5,
    "barcode": "123456789",
    "sku": "BAG-001",
    "hasOffer": false,
    "isActive": true,
    "brand": "EcoStore",
    "color": "Black",
    "materialComposition": "100% recycled rubber",
    "recycledContent": 100,
    "sustainabilityScore": 95,
    "carbonFootprint": 2.5,
    "badges": ["SUSTAINABLE", "HANDMADE"]
  }
}
```

**Required Fields:**

- `name` - String
- `description` - String
- `stock` - Integer
- `price` - Integer (in cents)
- `images` - Array of strings
- `subcategoryId` - Integer

**Optional Fields:**

- `barcode`, `sku` - String
- `hasOffer` - Boolean
- `offerPrice` - Integer
- `isActive` - Boolean
- `badges` - Array of Badge enum
- `brand`, `color` - String
- `materialComposition` - String
- `recycledContent` - Float (0-100)
- `sustainabilityScore` - Integer (0-100)
- `carbonFootprint` - Float

---

#### 2. Update Product

Update an existing product. **Requires authentication and ownership.**

```graphql
mutation UpdateProduct($input: UpdateProductInput!) {
  updateProduct(input: $input) {
    id
    name
    price
    stock
    updatedAt
  }
}
```

**Variables:**

```json
{
  "input": {
    "id": "1",
    "name": "Updated Product Name",
    "price": 6000,
    "stock": 15,
    "isActive": true
  }
}
```

**Required Fields:**

- `id` - String

**All other fields are optional** - only include fields you want to update.

---

#### 3. Delete Product

Soft delete a product (sets `deletedAt`). **Requires authentication.**

```graphql
mutation DeleteProduct($id: ID!) {
  deleteProduct(id: $id) {
    id
    name
    deletedAt
  }
}
```

**Variables:**

```json
{
  "id": "1"
}
```

---

#### 4. Toggle Product Active Status

Toggle a product's active status. **Requires authentication and ownership.**

```graphql
mutation ToggleProductActive($id: ID!) {
  toggleProductActive(id: $id) {
    id
    name
    isActive
  }
}
```

**Variables:**

```json
{
  "id": "1"
}
```

---

## 🏪 Store Categories Module

### Queries

#### 1. Get All Store Categories

Get all top-level store categories.

```graphql
query GetStoreCategories {
  getStoreCategories {
    id
    category
    href
  }
}
```

---

#### 2. Get Store Category by ID

Get a specific category with its subcategories and products.

```graphql
query GetStoreCategory($id: ID!, $page: Int!, $pageSize: Int!) {
  getStoreCategory(id: $id, page: $page, pageSize: $pageSize) {
    id
    category
    href
    subcategories {
      id
      subCategory
      href
    }
  }
}
```

**Variables:**

```json
{
  "id": "1",
  "page": 1,
  "pageSize": 20
}
```

---

#### 3. Get Subcategories by Category ID

Get all subcategories for a specific category.

```graphql
query GetStoreSubCategoriesByCategoryId($storeCategoryId: ID!) {
  getStoreSubCategoriesByCategoryId(storeCategoryId: $storeCategoryId) {
    id
    subCategory
    href
  }
}
```

**Variables:**

```json
{
  "storeCategoryId": "1"
}
```

---

#### 4. Get Store Subcategory by ID

Get details of a specific subcategory.

```graphql
query GetStoreSubCategory($id: ID!) {
  getStoreSubCategory(id: $id) {
    id
    subCategory
    href
    storeCategory {
      id
      category
    }
    materials {
      id
      sourceMaterial
      quantity
      unit
      isPrimary
      isRecycled
      recycledPercentage
    }
  }
}
```

**Variables:**

```json
{
  "id": "5"
}
```

---

#### 5. Get Paginated Subcategories

Get paginated subcategories for a category.

```graphql
query GetStoreSubCategories(
  $storeCategoryId: ID!
  $page: Int!
  $pageSize: Int!
) {
  getStoreSubCategories(
    storeCategoryId: $storeCategoryId
    page: $page
    pageSize: $pageSize
  ) {
    nodes {
      id
      subCategory
      href
    }
    pageInfo {
      totalCount
      hasNextPage
    }
  }
}
```

**Variables:**

```json
{
  "storeCategoryId": "1",
  "page": 1,
  "pageSize": 10
}
```

---

## 📚 Catalog Module

### Queries

#### 1. Get Complete Store Catalog

Get the complete store catalog with all categories and subcategories.

```graphql
query GetStoreCatalog {
  storeCatalog {
    id
    category
    href
    subcategories {
      id
      subCategory
      href
    }
  }
}
```

This is useful for building navigation menus or category browsers.

---

## 🌱 Impact Module

### Queries

#### 1. Get Material Impacts

Get environmental impact data for all materials.

```graphql
query GetMaterialImpacts {
  getMaterialImpacts {
    id
    materialType
    estimatedCo2SavingsKG
    estimatedWaterSavingsLT
  }
}
```

**Response Example:**

```json
{
  "getMaterialImpacts": [
    {
      "id": 1,
      "materialType": "Cotton",
      "estimatedCo2SavingsKG": 5.2,
      "estimatedWaterSavingsLT": 200
    },
    {
      "id": 2,
      "materialType": "Plastic",
      "estimatedCo2SavingsKG": 3.8,
      "estimatedWaterSavingsLT": 150
    }
  ]
}
```

---

#### 2. Get CO2 Impact Messages

Get CO2 impact message ranges for displaying to users.

```graphql
query GetCo2ImpactMessages {
  getCo2ImpactMessages {
    id
    min
    max
    message1
    message2
    message3
  }
}
```

**Usage:** Display different messages based on the calculated CO2 savings.

---

#### 3. Get Water Impact Messages

Get water impact message ranges.

```graphql
query GetWaterImpactMessages {
  getWaterImpactMessages {
    id
    min
    max
    message1
    message2
    message3
  }
}
```

---

#### 4. Calculate Product Impact

Calculate environmental impact for a product based on its category materials.

```graphql
query CalculateProductImpact($productCategoryId: ID!) {
  calculateProductImpact(productCategoryId: $productCategoryId) {
    totalCo2SavingsKG
    totalWaterSavingsLT
    materialBreakdown {
      materialType
      percentage
      weightKG
      co2SavingsKG
      waterSavingsLT
    }
  }
}
```

**Variables:**

```json
{
  "productCategoryId": "10"
}
```

**Response Example:**

```json
{
  "calculateProductImpact": {
    "totalCo2SavingsKG": 4.11,
    "totalWaterSavingsLT": 162,
    "materialBreakdown": [
      {
        "materialType": "Rubber",
        "percentage": 70,
        "weightKG": 0.7,
        "co2SavingsKG": 3.15,
        "waterSavingsLT": 126
      },
      {
        "materialType": "Plastic",
        "percentage": 30,
        "weightKG": 0.3,
        "co2SavingsKG": 0.96,
        "waterSavingsLT": 36
      }
    ]
  }
}
```

---

## 📦 Response Types

### Paginated Response

All list queries return a paginated response:

```typescript
{
  nodes: T[]           // Array of items
  pageInfo: {
    totalCount: number        // Total items in database
    totalPages: number        // Total pages available
    currentPage: number       // Current page number
    pageSize: number          // Items per page
    hasNextPage: boolean      // More pages available
    hasPreviousPage: boolean  // Previous page exists
    startCursor: string | null
    endCursor: string | null
  }
}
```

---

## 🚀 Usage Examples

### React/Next.js with Apollo Client

#### Setup Apollo Client

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:4002/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  const sellerId = localStorage.getItem('sellerId');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-seller-id': sellerId || '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

#### Query Example

```typescript
import { useQuery, gql } from '@apollo/client';

const GET_PRODUCTS = gql`
  query GetProducts($page: Int!, $pageSize: Int!) {
    getProducts(page: $page, pageSize: $pageSize) {
      nodes {
        id
        name
        price
        images
        stock
      }
      pageInfo {
        totalCount
        hasNextPage
      }
    }
  }
`;

function ProductList() {
  const { loading, error, data } = useQuery(GET_PRODUCTS, {
    variables: { page: 1, pageSize: 20 },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {data.getProducts.nodes.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>${product.price / 100}</p>
          <p>Stock: {product.stock}</p>
        </div>
      ))}
    </div>
  );
}
```

#### Mutation Example

```typescript
import { useMutation, gql } from '@apollo/client';

const ADD_PRODUCT = gql`
  mutation AddProduct($input: AddProductInput!) {
    addProduct(input: $input) {
      id
      name
      price
    }
  }
`;

function CreateProduct() {
  const [addProduct, { loading, error }] = useMutation(ADD_PRODUCT);

  const handleSubmit = async (formData) => {
    try {
      const { data } = await addProduct({
        variables: {
          input: {
            name: formData.name,
            description: formData.description,
            stock: parseInt(formData.stock),
            price: parseInt(formData.price * 100), // Convert to cents
            images: formData.images,
            subcategoryId: parseInt(formData.subcategoryId),
          },
        },
      });
      console.log('Product created:', data.addProduct);
    } catch (err) {
      console.error('Error creating product:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

---

### TypeScript Types

```typescript
// Product Types
interface StoreProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  barcode?: string;
  sku?: string;
  hasOffer: boolean;
  offerPrice?: number;
  images: string[];
  isActive: boolean;
  badges: Badge[];
  brand?: string;
  color?: string;
  ratingCount: number;
  ratings: number;
  reviewsNumber: number;
  materialComposition?: string;
  recycledContent?: number;
  sustainabilityScore?: number;
  carbonFootprint?: number;
  subcategoryId: number;
  storeSubCategory?: StoreSubCategory;
  productVariants?: ProductVariant[];
}

// Filter Input
interface ProductFilterInput {
  name?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  sellerId?: string;
  subcategoryId?: number;
  storeCategoryId?: number;
  brand?: string;
  color?: string;
  badges?: Badge[];
  hasOffer?: boolean;
  minStock?: number;
  minRating?: number;
  minRecycledContent?: number;
  minSustainabilityScore?: number;
}

// Sort Input
interface ProductSortInput {
  field?: 'CREATED_AT' | 'PRICE' | 'NAME' | 'RATING' | 'STOCK';
  order?: 'ASC' | 'DESC';
}

// Paginated Response
interface PaginatedResponse<T> {
  nodes: T[];
  pageInfo: PageInfo;
}

interface PageInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}
```

---

## 🔍 Tips & Best Practices

### 1. Pagination

Always use pagination for list queries to avoid performance issues:

```typescript
// Good
const { data } = useQuery(GET_PRODUCTS, {
  variables: { page: 1, pageSize: 20 },
});

// Bad - no pagination
const { data } = useQuery(GET_ALL_PRODUCTS);
```

### 2. Field Selection

Only request the fields you need:

```graphql
# Good - minimal fields
query {
  getProducts(page: 1, pageSize: 20) {
    nodes {
      id
      name
      price
    }
  }
}

# Bad - requesting everything
query {
  getProducts(page: 1, pageSize: 20) {
    nodes {
      # All fields...
    }
  }
}
```

### 3. Error Handling

Always handle errors in your components:

```typescript
const { loading, error, data } = useQuery(GET_PRODUCTS);

if (error) {
  // Check error type
  if (error.message.includes('Not Found')) {
    return <NotFoundPage />;
  }
  if (error.message.includes('Unauthorized')) {
    return <UnauthorizedPage />;
  }
  return <ErrorPage message={error.message} />;
}
```

### 4. Caching

Configure Apollo cache for better performance:

```typescript
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        getProducts: {
          keyArgs: ['filter', 'sort'],
          merge(existing, incoming, { args }) {
            if (!existing) return incoming;

            // Merge pages
            const merged = existing
              ? { ...existing }
              : { nodes: [], pageInfo: {} };
            merged.nodes = [...existing.nodes, ...incoming.nodes];
            merged.pageInfo = incoming.pageInfo;

            return merged;
          },
        },
      },
    },
  },
});
```

### 5. Loading States

Show loading states for better UX:

```typescript
if (loading) {
  return <ProductSkeleton />;
}
```

---

## 📞 Support

For questions or issues with the API:

1. Check the GraphQL Playground at `http://localhost:4002/graphql`
2. Review the Prisma schema at `prisma/schema.prisma`
3. Contact the development team

---

**Last Updated:** December 23, 2025  
**Version:** 0.0.1
