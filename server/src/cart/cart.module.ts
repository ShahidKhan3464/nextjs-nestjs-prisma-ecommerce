import { CartService } from './cart.service';
import { AuthModule } from 'src/auth/auth.module';
import { CartController } from './cart.controller';
import { Module, forwardRef } from '@nestjs/common';
import { GetCartProvider } from './providers/get-cart.provider';
import { SyncCartProvider } from './providers/sync-cart.provider';
import { ClearCartProvider } from './providers/clear-cart.provider';
import { AddCartItemProvider } from './providers/add-cart-item.provider';
import { UpdateCartItemProvider } from './providers/update-cart-item.provider';
import { RemoveCartItemProvider } from './providers/remove-cart-item.provider';

@Module({
  imports: [forwardRef(() => AuthModule)],
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
