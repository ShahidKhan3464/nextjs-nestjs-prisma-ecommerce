import { Injectable } from '@nestjs/common';
import { SyncWishlistDto } from './dto/sync-wishlist.dto';
import { GetWishlistProvider } from './providers/get-wishlist.provider';
import { SyncWishlistProvider } from './providers/sync-wishlist.provider';
import { ToggleWishlistItemProvider } from './providers/toggle-wishlist-item.provider';

@Injectable()
export class WishlistService {
  constructor(
    private readonly getWishlistProvider: GetWishlistProvider,
    private readonly syncWishlistProvider: SyncWishlistProvider,
    private readonly toggleWishlistItemProvider: ToggleWishlistItemProvider,
  ) {}

  findAll(userId: number) {
    return this.getWishlistProvider.findForUser(userId);
  }

  toggle(userId: number, productId: number) {
    return this.toggleWishlistItemProvider.toggle(userId, productId);
  }

  sync(userId: number, dto: SyncWishlistDto) {
    return this.syncWishlistProvider.sync(userId, dto);
  }
}
