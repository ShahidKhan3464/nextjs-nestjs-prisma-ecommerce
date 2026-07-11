import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CryptoModule } from 'src/crypto/crypto.module';
import { GetUsersProvider } from './providers/get-users.provider';
import { BlockUserProvider } from './providers/block-user.provider';
import { CreateUserProvider } from './providers/create-user.provider';
import { UpdateProfileProvider } from './providers/update-profile.provider';
import { GetUserDetailProvider } from './providers/get-user-detail.provider';
import { ChangePasswordProvider } from './providers/change-password.provider';
import { UploadProfileAvatarProvider } from './providers/upload-profile-avatar.provider';

@Module({
  imports: [CryptoModule],
  providers: [
    UsersService,
    GetUsersProvider,
    BlockUserProvider,
    CreateUserProvider,
    GetUserDetailProvider,
    UpdateProfileProvider,
    ChangePasswordProvider,
    UploadProfileAvatarProvider,
  ],
  controllers: [UsersController],
  exports: [UsersService, CreateUserProvider],
})
export class UsersModule {}
