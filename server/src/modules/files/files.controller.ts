import type { Response } from 'express';
import { FilesService } from './files.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UploadUserFileDto } from './dto/upload-user-file.dto';
import { UploadStoreFileDto } from './dto/upload-store-file.dto';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { AuthType } from 'src/modules/auth/constants/auth.constants';
import { UploadProductFileDto } from './dto/upload-product-file.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { RequireUploadedFilePipe } from './pipes/require-uploaded-file.pipe';
import { UploadSellerDocumentFileDto } from './dto/upload-seller-document-file.dto';
import { StoreFileUploadInterceptor } from './interceptors/store-file-upload.interceptor';
import { UserDocumentUploadInterceptor } from './interceptors/user-file-upload.interceptor';
import { ProductImageUploadInterceptor } from './interceptors/product-image-upload.interceptor';
import { SellerDocumentUploadInterceptor } from './interceptors/seller-document-upload.interceptor';
import {
  DeleteFileResponseDto,
  FileAssociationResponseDto,
} from './dto/stored-file-response.dto';
import {
  Get,
  Res,
  Post,
  Body,
  Param,
  Delete,
  Controller,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';

@ApiTags('files')
@ApiBearerAuth('access-token')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('secure/:fileId')
  @ApiOkResponse({ description: 'Authenticated download of a private file' })
  downloadSecureFile(
    @Param('fileId', ParseIntPipe) fileId: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.filesService.streamSecureFile(fileId, userId, roles, res);
  }

  // ── Product files ──────────────────────────────────────────────

  @Get('products/:productId')
  @Auth(AuthType.NONE)
  @ApiOkResponse({ type: [FileAssociationResponseDto] })
  listProductFiles(@Param('productId', ParseIntPipe) productId: number) {
    return this.filesService.listProductFiles(productId);
  }

  @Post('products/:productId')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadProductFileDto })
  @ApiCreatedResponse({ type: FileAssociationResponseDto })
  @UseInterceptors(ProductImageUploadInterceptor())
  uploadProductFile(
    @Param('productId', ParseIntPipe) productId: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: UploadProductFileDto,
    @UploadedFile(RequireUploadedFilePipe) file: Express.Multer.File,
  ) {
    return this.filesService.uploadProductFile(
      productId,
      userId,
      roles,
      dto.type,
      file,
    );
  }

  @Delete('products/:productId/associations/:associationId')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: DeleteFileResponseDto })
  deleteProductFile(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('associationId', ParseIntPipe) associationId: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
  ) {
    return this.filesService.deleteProductFile(
      productId,
      associationId,
      userId,
      roles,
    );
  }

  // ── Store files ────────────────────────────────────────────────

  @Get('stores/me')
  @Roles(UserRole.SELLER)
  @ApiOkResponse({ type: [FileAssociationResponseDto] })
  listMyStoreFiles(@ActiveUser() userId: number) {
    return this.filesService.listMyStoreFiles(userId);
  }

  @Get('stores/:storeId')
  @Auth(AuthType.NONE)
  @ApiOkResponse({ type: [FileAssociationResponseDto] })
  listStoreFiles(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.filesService.listStoreFiles(storeId);
  }

  @Post('stores/me')
  @Roles(UserRole.SELLER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadStoreFileDto })
  @ApiCreatedResponse({ type: FileAssociationResponseDto })
  @UseInterceptors(StoreFileUploadInterceptor())
  uploadMyStoreFile(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: UploadStoreFileDto,
    @UploadedFile(RequireUploadedFilePipe) file: Express.Multer.File,
  ) {
    return this.filesService.uploadMyStoreFile(userId, roles, dto.type, file);
  }

  @Post('stores/:storeId')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadStoreFileDto })
  @ApiCreatedResponse({ type: FileAssociationResponseDto })
  @UseInterceptors(StoreFileUploadInterceptor())
  uploadStoreFile(
    @Param('storeId', ParseIntPipe) storeId: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: UploadStoreFileDto,
    @UploadedFile(RequireUploadedFilePipe) file: Express.Multer.File,
  ) {
    return this.filesService.uploadStoreFile(
      storeId,
      userId,
      roles,
      dto.type,
      file,
    );
  }

  @Delete('stores/me/associations/:associationId')
  @Roles(UserRole.SELLER)
  @ApiOkResponse({ type: DeleteFileResponseDto })
  deleteMyStoreFile(
    @Param('associationId', ParseIntPipe) associationId: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
  ) {
    return this.filesService.deleteMyStoreFile(associationId, userId, roles);
  }

  @Delete('stores/:storeId/associations/:associationId')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: DeleteFileResponseDto })
  deleteStoreFile(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('associationId', ParseIntPipe) associationId: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
  ) {
    return this.filesService.deleteStoreFile(
      storeId,
      associationId,
      userId,
      roles,
    );
  }

  // ── User files ─────────────────────────────────────────────────

  @Get('users/me')
  @ApiOkResponse({ type: [FileAssociationResponseDto] })
  listMyUserFiles(@ActiveUser() userId: number) {
    return this.filesService.listUserFiles(userId);
  }

  @Get('users/:userId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: [FileAssociationResponseDto] })
  listUserFiles(@Param('userId', ParseIntPipe) userId: number) {
    return this.filesService.listUserFiles(userId);
  }

  @Post('users/me')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadUserFileDto })
  @ApiCreatedResponse({ type: FileAssociationResponseDto })
  @UseInterceptors(UserDocumentUploadInterceptor())
  uploadMyUserFile(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: UploadUserFileDto,
    @UploadedFile(RequireUploadedFilePipe) file: Express.Multer.File,
  ) {
    return this.filesService.uploadMyUserFile(userId, roles, dto.type, file);
  }

  @Post('users/:userId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadUserFileDto })
  @ApiCreatedResponse({ type: FileAssociationResponseDto })
  @UseInterceptors(UserDocumentUploadInterceptor())
  uploadUserFile(
    @Param('userId', ParseIntPipe) targetUserId: number,
    @ActiveUser() actorUserId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: UploadUserFileDto,
    @UploadedFile(RequireUploadedFilePipe) file: Express.Multer.File,
  ) {
    return this.filesService.uploadUserFile(
      targetUserId,
      actorUserId,
      roles,
      dto.type,
      file,
    );
  }

  @Delete('users/me/associations/:associationId')
  @ApiOkResponse({ type: DeleteFileResponseDto })
  deleteMyUserFile(
    @Param('associationId', ParseIntPipe) associationId: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
  ) {
    return this.filesService.deleteMyUserFile(associationId, userId, roles);
  }

  @Delete('users/:userId/associations/:associationId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: DeleteFileResponseDto })
  deleteUserFile(
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Param('associationId', ParseIntPipe) associationId: number,
    @ActiveUser() actorUserId: number,
    @ActiveUser('roles') roles: UserRole[],
  ) {
    return this.filesService.deleteUserFile(
      targetUserId,
      associationId,
      actorUserId,
      roles,
    );
  }

  // ── Seller documents ───────────────────────────────────────────

  @Get('seller-documents/me')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  @ApiOkResponse({ type: [FileAssociationResponseDto] })
  listMySellerDocuments(@ActiveUser() userId: number) {
    return this.filesService.listMySellerDocuments(userId);
  }

  @Get('seller-documents/:sellerProfileId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: [FileAssociationResponseDto] })
  listSellerDocuments(
    @Param('sellerProfileId', ParseIntPipe) sellerProfileId: number,
  ) {
    return this.filesService.listSellerDocuments(sellerProfileId);
  }

  @Post('seller-documents/me')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadSellerDocumentFileDto })
  @ApiCreatedResponse({ type: FileAssociationResponseDto })
  @UseInterceptors(SellerDocumentUploadInterceptor())
  uploadMySellerDocument(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: UploadSellerDocumentFileDto,
    @UploadedFile(RequireUploadedFilePipe) file: Express.Multer.File,
  ) {
    return this.filesService.uploadMySellerDocument(
      userId,
      roles,
      dto.type,
      file,
    );
  }

  @Post('seller-documents/:sellerProfileId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadSellerDocumentFileDto })
  @ApiCreatedResponse({ type: FileAssociationResponseDto })
  @UseInterceptors(SellerDocumentUploadInterceptor())
  uploadSellerDocument(
    @Param('sellerProfileId', ParseIntPipe) sellerProfileId: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: UploadSellerDocumentFileDto,
    @UploadedFile(RequireUploadedFilePipe) file: Express.Multer.File,
  ) {
    return this.filesService.uploadSellerDocument(
      sellerProfileId,
      userId,
      roles,
      dto.type,
      file,
    );
  }

  @Delete('seller-documents/me/associations/:associationId')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  @ApiOkResponse({ type: DeleteFileResponseDto })
  deleteMySellerDocument(
    @Param('associationId', ParseIntPipe) associationId: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
  ) {
    return this.filesService.deleteMySellerDocument(
      associationId,
      userId,
      roles,
    );
  }

  @Delete('seller-documents/:sellerProfileId/associations/:associationId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: DeleteFileResponseDto })
  deleteSellerDocument(
    @Param('sellerProfileId', ParseIntPipe) sellerProfileId: number,
    @Param('associationId', ParseIntPipe) associationId: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
  ) {
    return this.filesService.deleteSellerDocument(
      sellerProfileId,
      associationId,
      userId,
      roles,
    );
  }
}
