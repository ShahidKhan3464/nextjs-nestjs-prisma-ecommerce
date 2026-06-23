import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { Order } from 'src/orders/entities/order.entity';
import { FilesModule } from 'src/common/files/files.module';
import { GetUsersProvider } from './providers/get-users.provider';
import { BlockUserProvider } from './providers/block-user.provider';
import { CreateUserProvider } from './providers/create-user.provider.js';
import { WishlistItem } from 'src/wishlist/entities/wishlist-item.entity';
import { UpdateProfileProvider } from './providers/update-profile.provider';
import { GetUserDetailProvider } from './providers/get-user-detail.provider';
import { ChangePasswordProvider } from './providers/change-password.provider';
import { UploadProfileAvatarProvider } from './providers/upload-profile-avatar.provider';

@Module({
  imports: [
    FilesModule,
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([User, Order, WishlistItem]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    GetUsersProvider,
    BlockUserProvider,
    CreateUserProvider,
    UpdateProfileProvider,
    GetUserDetailProvider,
    ChangePasswordProvider,
    UploadProfileAvatarProvider,
  ],
  exports: [UsersService],
})
export class UsersModule {}
