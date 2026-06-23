import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { DashboardService } from './dashboard.service';
import { Order } from 'src/orders/entities/order.entity';
import { FilesModule } from 'src/common/files/files.module';
import { DashboardController } from './dashboard.controller';
import { CartItem } from 'src/cart/entities/cart-item.entity';
import { Product } from 'src/products/entities/product.entity';
import { WishlistItem } from 'src/wishlist/entities/wishlist-item.entity';
import { ProductVariant } from 'src/products/entities/product-variant.entity';
import { GetAdminDashboardProvider } from './providers/get-admin-dashboard.provider';
import { GetCustomerDashboardProvider } from './providers/get-customer-dashboard.provider';

@Module({
  imports: [
    FilesModule,
    TypeOrmModule.forFeature([
      User,
      Order,
      Product,
      CartItem,
      WishlistItem,
      ProductVariant,
    ]),
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    GetAdminDashboardProvider,
    GetCustomerDashboardProvider,
  ],
})
export class DashboardModule {}
