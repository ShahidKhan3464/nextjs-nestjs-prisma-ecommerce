import { UsersService } from './users.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { parseUserBlockedFilter, QueryUserDto } from './dto/query-user.dto';
import { getUploadsRoot, UploadSubdir } from 'src/common/storage/uploads-root';
import { createImageDiskMulterOptions } from 'src/common/storage/image-upload.multer';
import {
  Get,
  Body,
  Patch,
  Post,
  Param,
  Query,
  Controller,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

const avatarMulter = createImageDiskMulterOptions(
  getUploadsRoot(),
  UploadSubdir.CUSTOMERS,
);

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@ActiveUser() userId: number) {
    return this.usersService.findMeWithAvatar(userId);
  }

  @Patch('me')
  updateMe(@ActiveUser() userId: number, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/password')
  changePassword(@ActiveUser() userId: number, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(userId, dto);
  }

  @Post('me/avatar')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', avatarMulter))
  uploadAvatar(
    @ActiveUser() userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(userId, file);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll(@Query() query: QueryUserDto) {
    const { isBlocked: isBlockedRaw, ...rest } = query;
    return this.usersService.findAllPaginated({
      ...rest,
      isBlocked: parseUserBlockedFilter(isBlockedRaw),
    });
  }

  @Get(':id/detail')
  @Roles(UserRole.SUPER_ADMIN)
  findDetail(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserDetail(id);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/block')
  @Roles(UserRole.SUPER_ADMIN)
  blockUser(
    @Param('id', ParseIntPipe) id: number,
    @Body('isBlocked') isBlocked: boolean,
  ) {
    return this.usersService.blockUser(id, isBlocked);
  }
}
