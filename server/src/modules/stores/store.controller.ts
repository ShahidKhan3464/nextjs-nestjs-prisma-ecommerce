import { StoreService } from './store.service';
import { QueryStoresDto } from './dto/query-stores.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { SuspendStoreDto } from './dto/suspend-store.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoreResponseDto } from './dto/store-response.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UploadStoreFileDto } from './dto/upload-store-file.dto';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { AuthType } from 'src/modules/auth/constants/auth.constants';
import { getUploadsRoot } from 'src/integrations/storage/uploads-root';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { createImageDiskMulterOptions } from 'src/integrations/storage/multer/image-upload.multer';
import {
  StoreFileType,
  STORE_UPLOAD_SUBDIR,
} from './constants/store.constants';
import {
  Get,
  Body,
  Post,
  Patch,
  Param,
  Query,
  Delete,
  Controller,
  ParseIntPipe,
  ParseEnumPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';

const storeImageMulter = createImageDiskMulterOptions(
  getUploadsRoot(),
  STORE_UPLOAD_SUBDIR,
);

@ApiTags('store')
@ApiBearerAuth('access-token')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('me')
  @Roles(UserRole.SELLER)
  @ApiOkResponse({ type: StoreResponseDto })
  getMe(@ActiveUser() userId: number) {
    return this.storeService.getMyStore(userId);
  }

  @Patch('me')
  @Roles(UserRole.SELLER)
  @ApiOkResponse({ type: StoreResponseDto })
  updateMe(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storeService.updateMyStore(userId, roles, dto);
  }

  @Delete('me')
  @Roles(UserRole.SELLER)
  @ApiOkResponse({ type: StoreResponseDto })
  softDeleteMe(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
  ) {
    return this.storeService.softDeleteMyStore(userId, roles);
  }

  @Post('me/files')
  @Roles(UserRole.SELLER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadStoreFileDto })
  @ApiOkResponse({ type: StoreResponseDto })
  @UseInterceptors(FileInterceptor('file', storeImageMulter))
  uploadMyFile(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: UploadStoreFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storeService.uploadMyStoreFile(userId, roles, dto.type, file);
  }

  @Delete('me/files/:type')
  @Roles(UserRole.SELLER)
  @ApiOkResponse({ type: StoreResponseDto })
  removeMyFile(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Param('type', new ParseEnumPipe(StoreFileType)) type: StoreFileType,
  ) {
    return this.storeService.removeMyStoreFile(userId, roles, type);
  }

  @Get('slug/:slug')
  @Auth(AuthType.NONE)
  @ApiOkResponse({ type: StoreResponseDto })
  findBySlug(@Param('slug') slug: string) {
    return this.storeService.getBySlug(slug);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll(@Query() query: QueryStoresDto) {
    return this.storeService.listStores(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: StoreResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.getById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: StoreResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storeService.updateStore(id, userId, roles, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: StoreResponseDto })
  softDelete(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
  ) {
    return this.storeService.softDeleteStore(id, userId, roles);
  }

  @Patch(':id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: StoreResponseDto })
  suspend(@Param('id', ParseIntPipe) id: number, @Body() dto: SuspendStoreDto) {
    return this.storeService.suspendStore(id, dto);
  }

  @Patch(':id/unsuspend')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: StoreResponseDto })
  unsuspend(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.unsuspendStore(id);
  }

  @Patch(':id/verify')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: StoreResponseDto })
  verify(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.verifyStore(id);
  }

  @Patch(':id/unverify')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: StoreResponseDto })
  unverify(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.unverifyStore(id);
  }

  @Post(':id/files')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadStoreFileDto })
  @ApiOkResponse({ type: StoreResponseDto })
  @UseInterceptors(FileInterceptor('file', storeImageMulter))
  uploadFile(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: UploadStoreFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storeService.uploadStoreFile(id, userId, roles, dto.type, file);
  }

  @Delete(':id/files/:type')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: StoreResponseDto })
  removeFile(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Param('type', new ParseEnumPipe(StoreFileType)) type: StoreFileType,
  ) {
    return this.storeService.removeStoreFile(id, userId, roles, type);
  }
}
