import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CryptoModule } from 'src/crypto/crypto.module';
import { FilesModule } from 'src/modules/files/files.module';
import { GetUsersProvider } from './providers/get-users.provider';
import { BlockUserProvider } from './providers/block-user.provider';
import { CreateUserProvider } from './providers/create-user.provider';
import { AuthTokensModule } from 'src/modules/auth/auth-tokens.module';
import { UpdateProfileProvider } from './providers/update-profile.provider';
import { GetUserDetailProvider } from './providers/get-user-detail.provider';
import { ChangePasswordProvider } from './providers/change-password.provider';
import { UploadProfileAvatarProvider } from './providers/upload-profile-avatar.provider';

@Module({
  imports: [CryptoModule, FilesModule, AuthTokensModule],
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
