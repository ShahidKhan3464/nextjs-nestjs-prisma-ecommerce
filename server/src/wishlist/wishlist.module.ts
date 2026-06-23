import { AuthModule } from 'src/auth/auth.module';
import { Module, forwardRef } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { GetWishlistProvider } from './providers/get-wishlist.provider';
import { SyncWishlistProvider } from './providers/sync-wishlist.provider';
import { ToggleWishlistItemProvider } from './providers/toggle-wishlist-item.provider';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [
    WishlistService,
    GetWishlistProvider,
    SyncWishlistProvider,
    ToggleWishlistItemProvider,
  ],
  controllers: [WishlistController],
})
export class WishlistModule {}
