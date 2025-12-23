# Ekoru Stores Subgraph

GraphQL Federation subgraph for Ekoru's store products, categories, and environmental impact tracking.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Concepts](#key-concepts)
- [Development](#development)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Environment Variables](#environment-variables)

## 🎯 Overview

The **Ekoru Stores Subgraph** is a NestJS GraphQL Federation service that manages:

- **Store Products** - New products made from upcycled/recycled materials
- **Store Categories & Subcategories** - Product classification system
- **Product Variants** - Size, color, and other variations
- **Environmental Impact** - CO2 and water savings calculations
- **Material Tracking** - Recycled content and sustainability scores

### What This Service Does NOT Handle

- **Marketplace Products** - Used/second-hand items (handled by another subgraph)
- **User Authentication** - Handled by gateway/auth service
- **Payment Processing** - Handled by payment subgraph
- **Orders** - Handled by orders subgraph

## 🏗️ Architecture

### Technology Stack

- **Framework**: NestJS 11.x
- **GraphQL**: Apollo Federation v2
- **Database**: PostgreSQL with Prisma ORM
- **Language**: TypeScript 5.7
- **Testing**: Jest
- **Node**: >= 22.14.0

### Apollo Federation

This service is designed as a **federated subgraph** that composes with other services in the Ekoru ecosystem. It uses Apollo Federation v2 to:

- Define entities that can be referenced by other subgraphs
- Extend types from other subgraphs (e.g., `Seller`)
- Share schema through the Apollo Gateway

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 22.14.0
- **npm** >= 10.0.0
- **PostgreSQL** database
- **Prisma CLI** (installed via npm)

## 🚀 Getting Started

### 1. Clone & Install

```bash
# Navigate to the project directory
cd ekoru-stores

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ekoru_stores?schema=public"

# Server
PORT=4002
NODE_ENV=development

# GraphQL
GRAPHQL_PLAYGROUND=true
```

### 3. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (if seed file exists)
npx prisma db seed
```

### 4. Start Development Server

```bash
# Start with hot-reload
npm run start:dev

# Server will be available at http://localhost:4002
# GraphQL Playground at http://localhost:4002/graphql
```

## 📁 Project Structure

```
src/
├── app.module.ts              # Root module
├── main.ts                    # Application entry point
├── catalog/                   # Store catalog queries
│   ├── catalog.module.ts
│   ├── catalog.resolver.ts
│   ├── catalog.service.ts
│   └── entities/              # GraphQL entities
│       ├── store-product.entity.ts
│       ├── store-category.entity.ts
│       ├── store-subcategory.entity.ts
│       ├── product-variant.entity.ts
│       └── ...
├── products/                  # Product CRUD operations
│   ├── products.module.ts
│   ├── products.resolver.ts
│   ├── products.service.ts
│   ├── products.spec.ts
│   └── dto/                   # Input types
│       ├── add-product.input.ts
│       ├── update-product.input.ts
│       ├── product-filter.input.ts
│       └── product-sort.input.ts
├── store/                     # Category management
│   ├── store.module.ts
│   ├── store.resolver.ts
│   └── store.service.ts
├── impact/                    # Environmental impact
│   ├── impact.module.ts
│   ├── impact.resolver.ts
│   ├── impact.service.ts
│   └── impact.spec.ts
├── common/                    # Shared utilities
│   ├── decorators/
│   ├── exceptions/
│   └── utils/
│       └── pagination.ts
├── config/                    # Configuration
│   └── configuration.ts
├── graphql/                   # GraphQL utilities
│   ├── enums/
│   └── scalars/
└── prisma/                    # Prisma client module
    ├── prisma.module.ts
    └── prisma.service.ts

prisma/
└── schema.prisma              # Database schema
```

## 🔑 Key Concepts

### 1. Store Products vs Marketplace Products

**Store Products** (this subgraph):

- New items made from recycled/upcycled materials
- Have inventory (stock management)
- Product variants (size, color)
- Sustainability scores
- Material composition tracking

**Marketplace Products** (different subgraph):

- Used/second-hand items
- Support exchanges
- Product conditions (NEW, USED, etc.)
- No stock management

### 2. Environmental Impact Tracking

Each product/subcategory tracks:

- **CO2 Savings** - Estimated carbon footprint reduction
- **Water Savings** - Water consumption reduction
- **Material Breakdown** - Composition by material type
- **Recycled Content** - Percentage of recycled materials
- **Sustainability Score** - 0-100 rating

### 3. Product Variants

Store products can have multiple variants:

- Different sizes (S, M, L, XL)
- Different colors
- Different prices per variant
- Individual stock tracking per variant

### 4. Authorization

The service uses seller authentication via headers:

- `x-seller-id` - Current authenticated seller
- `authorization` - Bearer token

The `@CurrentSeller()` decorator extracts the seller ID for authorization checks.

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start with debugger

# Build
npm run build              # Compile TypeScript

# Production
npm run start:prod         # Run production build

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format with Prettier

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Generate coverage report
npm run test:e2e           # Run end-to-end tests
```

### Adding New Features

#### 1. Create a Module

```bash
nest generate module feature-name
nest generate service feature-name
nest generate resolver feature-name
```

#### 2. Define GraphQL Entity

```typescript
// feature-name/entities/feature.entity.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Feature {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;
}
```

#### 3. Create Resolver

```typescript
// feature-name/feature.resolver.ts
import { Resolver, Query } from '@nestjs/graphql';
import { FeatureService } from './feature.service';
import { Feature } from './entities/feature.entity';

@Resolver(() => Feature)
export class FeatureResolver {
  constructor(private readonly service: FeatureService) {}

  @Query(() => [Feature])
  async getFeatures() {
    return this.service.findAll();
  }
}
```

### Common Patterns

#### Pagination

Use utility functions from `common/utils/pagination.ts`:

```typescript
import { calculatePrismaParams, createPaginatedResponse } from '../common/utils/pagination';

async getProducts(page: number = 1, pageSize: number = 20) {
  const { skip, take } = calculatePrismaParams(page, pageSize);
  const totalCount = await this.prisma.storeProduct.count();
  const products = await this.prisma.storeProduct.findMany({ skip, take });

  return createPaginatedResponse(products, page, pageSize, totalCount);
}
```

#### Authorization

Use the `@CurrentSeller()` decorator:

```typescript
import { CurrentSeller } from '../common/decorators';

@Mutation(() => StoreProduct)
async createProduct(
  @Args('input') input: AddProductInput,
  @CurrentSeller() sellerId: string,
) {
  return this.service.create(input, sellerId);
}
```

#### Error Handling

Use custom exceptions from `common/exceptions`:

```typescript
import {
  NotFoundError,
  UnAuthorizedError,
  InternalServerError,
} from '../common/exceptions/graphql.exceptions';

if (!product) {
  throw new NotFoundError('Producto no encontrado');
}

if (product.sellerId !== currentSeller) {
  throw new UnAuthorizedError('No autorizado');
}
```

## 🧪 Testing

### Unit Tests

Located alongside source files with `.spec.ts` extension:

```bash
npm run test                  # Run all tests
npm run test:watch           # Watch mode
npm run test:cov             # With coverage
```

### Writing Tests

Example test structure:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    storeProduct: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should create a product', async () => {
    // Test implementation
  });
});
```

## 📚 API Documentation

See [docs/queries.md](./docs/queries.md) for a complete list of available GraphQL queries and mutations with examples.

Quick overview:

- **Products**: CRUD operations for store products
- **Categories**: Browse store categories and subcategories
- **Impact**: Calculate environmental impact
- **Catalog**: Get complete store catalog structure

## 🗄️ Database

### Prisma Schema

The database schema is defined in `prisma/schema.prisma`. Key models:

- `StoreProduct` - Store product data
- `StoreCategory` - Top-level categories
- `StoreSubCategory` - Subcategories within categories
- `StoreProductMaterial` - Materials used in products
- `ProductVariant` - Product variations
- `MaterialImpactEstimate` - Environmental impact data

### Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View current database
npx prisma studio
```

## 🔐 Environment Variables

| Variable             | Description                          | Default     | Required |
| -------------------- | ------------------------------------ | ----------- | -------- |
| `DATABASE_URL`       | PostgreSQL connection string         | -           | Yes      |
| `PORT`               | Server port                          | 4002        | No       |
| `NODE_ENV`           | Environment (development/production) | development | No       |
| `GRAPHQL_PLAYGROUND` | Enable GraphQL Playground            | true        | No       |

## 🤝 Contributing

### Code Style

- Use TypeScript strict mode
- Follow NestJS conventions
- Write tests for new features
- Use meaningful variable names
- Add JSDoc comments for complex logic

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: add feature description"

# Push and create PR
git push origin feature/feature-name
```

### Commit Convention

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Code refactoring
- `chore:` - Maintenance

## 📞 Support

For questions or issues:

1. Check [docs/queries.md](./docs/queries.md) for API documentation
2. Review the Prisma schema in `prisma/schema.prisma`
3. Contact the development team

## 📄 License

Private - Ekoru Internal Use Only
