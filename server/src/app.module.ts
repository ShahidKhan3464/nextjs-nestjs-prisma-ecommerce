import { Module } from '@nestjs/common';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import mailConfig from './config/mail.config';
import stripeConfig from './config/stripe.config';
import storageConfig from './config/storage.config';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import databaseConfig from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { SeedersModule } from './seeders/seeders.module';
import { CartModule } from './modules/carts/cart.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { StoreModule } from './modules/stores/store.module';
import { MailModule } from './integrations/mail/mail.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SellerModule } from './modules/sellers/seller.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AddressModule } from './modules/addresses/address.module';
import { ProductsModule } from './modules/products/products.module';
import environmentValidation from './config/environment.validation';
import { PaymentsModule } from './modules/payments/payments.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { WishlistModule } from './modules/wishlists/wishlist.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PaginationModule } from './common/pagination/pagination.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { ProductVariantsModule } from './modules/product-variants/product-variants.module';
import { DataResponseInterceptor } from './common/interceptors/data-response/data-response.interceptor';

@Module({
  imports: [
    AuthModule,
    MailModule,
    CartModule,
    FilesModule,
    StoreModule,
    UsersModule,
    SellerModule,
    OrdersModule,
    HealthModule,
    PrismaModule,
    CommonModule,
    SeedersModule,
    ReviewsModule,
    AddressModule,
    WishlistModule,
    ProductsModule,
    PaymentsModule,
    DashboardModule,
    PaginationModule,
    CategoriesModule,
    NotificationModule,
    ProductVariantsModule,
    ThrottlerModule.forRoot([
      {
        limit: 100,
        ttl: 60_000,
        name: 'default',
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: environmentValidation,
      load: [
        appConfig,
        jwtConfig,
        mailConfig,
        stripeConfig,
        storageConfig,
        databaseConfig,
      ],
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DataResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
