import { UsersService } from './users.service';
import { BlockUserDto } from './dto/block-user.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { parseUserBlockedFilter, QueryUserDto } from './dto/query-user.dto';
import { UserResponseDto, UserMeResponseDto } from './dto/user-response.dto';
import { createImageDiskMulterOptions } from 'src/integrations/storage/multer/image-upload.multer';
import {
  UserDetailResponseDto,
  PaginatedUserResponseDto,
} from './dto/user-detail-response.dto';
import {
  UploadSubdir,
  getUploadsRoot,
} from 'src/integrations/storage/uploads-root';
import {
  ApiTags,
  ApiOkResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  Get,
  Body,
  Post,
  Patch,
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
  @ApiOkResponse({ type: UserMeResponseDto })
  getMe(@ActiveUser() userId: number) {
    return this.usersService.findMeWithAvatar(userId);
  }

  @Patch('me')
  @ApiOkResponse({ type: UserResponseDto })
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
    @ActiveUser('roles') roles: UserRole[],
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(userId, roles, file);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: PaginatedUserResponseDto })
  findAll(@Query() query: QueryUserDto) {
    const { isBlocked: isBlockedRaw, ...rest } = query;
    return this.usersService.findAllPaginated({
      ...rest,
      isBlocked: parseUserBlockedFilter(isBlockedRaw),
    });
  }

  @Get(':id/detail')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: UserDetailResponseDto })
  findDetail(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserDetail(id);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: UserResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/block')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: UserResponseDto })
  blockUser(@Param('id', ParseIntPipe) id: number, @Body() dto: BlockUserDto) {
    return this.usersService.blockUser(id, dto.isBlocked);
  }
}
