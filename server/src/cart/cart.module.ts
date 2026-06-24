import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { GetCartProvider } from './providers/get-cart.provider';
import { SyncCartProvider } from './providers/sync-cart.provider';
import { ClearCartProvider } from './providers/clear-cart.provider';
import { AddCartItemProvider } from './providers/add-cart-item.provider';
import { UpdateCartItemProvider } from './providers/update-cart-item.provider';
import { RemoveCartItemProvider } from './providers/remove-cart-item.provider';

@Module({
  providers: [
    CartService,
    GetCartProvider,
    SyncCartProvider,
    ClearCartProvider,
    AddCartItemProvider,
    UpdateCartItemProvider,
    RemoveCartItemProvider,
  ],
  controllers: [CartController],
})
export class CartModule {}
