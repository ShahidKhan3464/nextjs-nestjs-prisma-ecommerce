import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import appConfig from './config/app.config';
import mailConfig from './config/mail.config';
import { CartModule } from './cart/cart.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import jwtConfig from './auth/config/jwt.config';
import stripeConfig from './config/stripe.config';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import databaseConfig from './config/database.config';
import { SeedersModule } from './seeders/seeders.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { WishlistModule } from './wishlist/wishlist.module';
import { ProductsModule } from './products/products.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesGuard } from './auth/guards/roles/roles.guard';
import { DashboardModule } from './dashboard/dashboard.module';
import { CategoriesModule } from './categories/categories.module';
import environmentValidation from './config/environment.validation';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PaginationModule } from './common/pagination/pagination.module';
import { AccessTokenGuard } from './auth/guards/access-token/access-token.guard';
import { AuthenticationGuard } from './auth/guards/authentication/authentication.guard';
import { DataResponseInterceptor } from './common/interceptors/data-response/data-response.interceptor';

@Module({
  imports: [
    AuthModule,
    MailModule,
    CartModule,
    UsersModule,
    OrdersModule,
    SeedersModule,
    WishlistModule,
    ProductsModule,
    DashboardModule,
    CategoriesModule,
    PaginationModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
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
      load: [appConfig, databaseConfig, mailConfig, stripeConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: +configService.get('database.port'),
        database: configService.get('database.database'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        synchronize: configService.get<boolean>('database.synchronize'),
        autoLoadEntities: configService.get<boolean>(
          'database.autoLoadEntities',
        ),
      }),
    }),
  ],
  providers: [
    AccessTokenGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: DataResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
