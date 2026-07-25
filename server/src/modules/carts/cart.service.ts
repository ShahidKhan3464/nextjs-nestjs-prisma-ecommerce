import { Injectable } from '@nestjs/common';
import { SyncCartDto } from './dto/sync-cart.dto';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { GetCartProvider } from './providers/get-cart.provider';
import { SyncCartProvider } from './providers/sync-cart.provider';
import { ClearCartProvider } from './providers/clear-cart.provider';
import { AddCartItemProvider } from './providers/add-cart-item.provider';
import { UpdateCartItemProvider } from './providers/update-cart-item.provider';
import { RemoveCartItemProvider } from './providers/remove-cart-item.provider';

@Injectable()
export class CartService {
  constructor(
    private readonly getCartProvider: GetCartProvider,
    private readonly syncCartProvider: SyncCartProvider,
    private readonly clearCartProvider: ClearCartProvider,
    private readonly addCartItemProvider: AddCartItemProvider,
    private readonly updateCartItemProvider: UpdateCartItemProvider,
    private readonly removeCartItemProvider: RemoveCartItemProvider,
  ) {}

  findAll(userId: number) {
    return this.getCartProvider.findByUser(userId);
  }

  add(userId: number, dto: AddCartItemDto) {
    return this.addCartItemProvider.add(userId, dto);
  }

  update(userId: number, variantId: number, dto: UpdateCartItemDto) {
    return this.updateCartItemProvider.update(userId, variantId, dto);
  }

  remove(userId: number, variantId: number) {
    return this.removeCartItemProvider.remove(userId, variantId);
  }

  clear(userId: number) {
    return this.clearCartProvider.clear(userId);
  }

  sync(userId: number, dto: SyncCartDto) {
    return this.syncCartProvider.sync(userId, dto);
  }
}
