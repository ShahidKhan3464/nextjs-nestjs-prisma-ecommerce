import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Module, forwardRef } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { Product } from 'src/products/entities/product.entity';
import { WishlistItem } from './entities/wishlist-item.entity';
import { GetWishlistProvider } from './providers/get-wishlist.provider';
import { SyncWishlistProvider } from './providers/sync-wishlist.provider';
import { ToggleWishlistItemProvider } from './providers/toggle-wishlist-item.provider';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([WishlistItem, Product]),
  ],
  controllers: [WishlistController],
  providers: [
    WishlistService,
    GetWishlistProvider,
    SyncWishlistProvider,
    ToggleWishlistItemProvider,
  ],
})
export class WishlistModule {}
