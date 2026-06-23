import { UsersService } from './users.service';
import { AuthModule } from 'src/auth/auth.module';
import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { GetUsersProvider } from './providers/get-users.provider';
import { BlockUserProvider } from './providers/block-user.provider';
import { CreateUserProvider } from './providers/create-user.provider';
import { UpdateProfileProvider } from './providers/update-profile.provider';
import { GetUserDetailProvider } from './providers/get-user-detail.provider';
import { ChangePasswordProvider } from './providers/change-password.provider';
import { UploadProfileAvatarProvider } from './providers/upload-profile-avatar.provider';

@Module({
  imports: [forwardRef(() => AuthModule)],
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
  exports: [UsersService],
})
export class UsersModule {}
