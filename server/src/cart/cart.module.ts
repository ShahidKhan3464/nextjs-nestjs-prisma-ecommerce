import { CartService } from './cart.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CartController } from './cart.controller';
import { Module, forwardRef } from '@nestjs/common';
import { CartItem } from './entities/cart-item.entity';
import { FilesModule } from 'src/common/files/files.module';
import { GetCartProvider } from './providers/get-cart.provider';
import { SyncCartProvider } from './providers/sync-cart.provider';
import { ClearCartProvider } from './providers/clear-cart.provider';
import { AddCartItemProvider } from './providers/add-cart-item.provider';
import { ProductVariant } from 'src/products/entities/product-variant.entity';
import { UpdateCartItemProvider } from './providers/update-cart-item.provider';
import { RemoveCartItemProvider } from './providers/remove-cart-item.provider';

@Module({
  imports: [
    FilesModule,
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([CartItem, ProductVariant]),
  ],
  controllers: [CartController],
  providers: [
    CartService,
    GetCartProvider,
    SyncCartProvider,
    ClearCartProvider,
    AddCartItemProvider,
    UpdateCartItemProvider,
    RemoveCartItemProvider,
  ],
})
export class CartModule {}
