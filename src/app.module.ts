import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { GqlThrottlerGuard } from './common/guards/gql-throtler.guard';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AdminActivityInterceptor } from './common/admin-activity.interceptor';
import { ListSizeCapInterceptor } from './common/list-size-cap.interceptor';
import { GraphQLModule } from '@nestjs/graphql';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { ModuleRef } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { JSONScalar } from './graphql/scalars';
import { HealthController } from './health/health.controller';
import configuration from './config/configuration';
import { CatalogV2Module } from './catalog-v2/catalog-v2.module';
import { StoreCategoriesModule } from './storeCategories';
import { StoreSubCategoriesModule } from './storeSubCategories';
import { AdminCatalogModule } from './adminCatalog';
import { AdminStoreProductModule } from './adminStoreProducts';
import { BusinessProductsModule } from './businessProducts';
import { createContextFactory } from './graphql/context';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';

// Import to register enums
import './graphql/enums';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    // Metrics
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate limiting: 100 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // GraphQL Federation
    GraphQLModule.forRootAsync<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      useFactory: (moduleRef: ModuleRef) => ({
        autoSchemaFile: {
          federation: 2,
        },
        sortSchema: true,
        playground: process.env.ENVIRONMENT !== 'production',
        context: createContextFactory(moduleRef),
        formatError: (error) => {
          if (process.env.ENVIRONMENT === 'production') {
            delete error.extensions?.exception;
          }
          return error;
        },
      }),
      inject: [ModuleRef],
    }),

    // Database
    PrismaModule,

    // Store catalog (web menu) queries only
    CatalogV2Module,

    // Store categories subdomain
    StoreCategoriesModule,

    // Store sub categories subdomain
    StoreSubCategoriesModule,

    // Products Module
    ProductsModule,
    ReviewsModule,

    // Platform-admin CRUD over store catalog tables (raw reads, bulk upserts, deletes)
    AdminCatalogModule,
    AdminStoreProductModule,

    // A business publishing its own catalog from the panel (ADM-16)
    BusinessProductsModule,
  ],
  providers: [
    JSONScalar,
    { provide: APP_GUARD, useClass: GqlThrottlerGuard },
    // Every admin mutation leaves an AdminActivityLog row (USR-12).
    { provide: APP_INTERCEPTOR, useClass: AdminActivityInterceptor },
    // No query reads more than 500 rows at once (GW-6).
    { provide: APP_INTERCEPTOR, useClass: ListSizeCapInterceptor },
  ],
  controllers: [HealthController],
})
export class AppModule {}
