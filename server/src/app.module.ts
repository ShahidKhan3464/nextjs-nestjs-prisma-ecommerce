import { Module } from '@nestjs/common';
import appConfig from './config/app.config';
import { ConfigModule } from '@nestjs/config';
import mailConfig from './config/mail.config';
import { CartModule } from './cart/cart.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import stripeConfig from './config/stripe.config';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { StoreModule } from './store/store.module';
import { OrdersModule } from './orders/orders.module';
import { SellerModule } from './seller/seller.module';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { SeedersModule } from './seeders/seeders.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { WishlistModule } from './wishlist/wishlist.module';
import { ProductsModule } from './products/products.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CategoriesModule } from './categories/categories.module';
import environmentValidation from './config/environment.validation';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { NotificationModule } from './notification/notification.module';
import { PaginationModule } from './common/pagination/pagination.module';
import { ProductVariantsModule } from './product-variants/product-variants.module';
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
    PrismaModule,
    CommonModule,
    SeedersModule,
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
      load: [appConfig, mailConfig, stripeConfig],
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
