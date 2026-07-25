import { SellerService } from './seller.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { QuerySellerProfilesDto } from './dto/query-seller-profiles.dto';
import { CreateSellerProfileDto } from './dto/create-seller-profile.dto';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { RejectSellerProfileDto } from './dto/reject-seller-profile.dto';
import { ApproveSellerProfileDto } from './dto/approve-seller-profile.dto';
import { SuspendSellerProfileDto } from './dto/suspend-seller-profile.dto';
import { UploadSellerDocumentDto } from './dto/upload-seller-document.dto';
import { SellerProfileResponseDto } from './dto/seller-profile-response.dto';
import { createDocumentDiskMulterOptions } from 'src/integrations/storage/multer/document-upload.multer';
import {
  UploadSubdir,
  getUploadsRoot,
} from 'src/integrations/storage/uploads-root';
import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
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

const sellerDocumentMulter = createDocumentDiskMulterOptions(
  getUploadsRoot(),
  UploadSubdir.SELLERS,
);

@ApiTags('seller')
@ApiBearerAuth('access-token')
@Controller('seller-profile')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Post()
  @Roles(UserRole.BUYER)
  @ApiCreatedResponse({ type: SellerProfileResponseDto })
  create(@ActiveUser() userId: number, @Body() dto: CreateSellerProfileDto) {
    return this.sellerService.createProfile(userId, dto);
  }

  @Get('me')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  @ApiOkResponse({ type: SellerProfileResponseDto })
  getMe(@ActiveUser() userId: number) {
    return this.sellerService.getMyProfile(userId);
  }

  @Patch('me')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  @ApiOkResponse({ type: SellerProfileResponseDto })
  updateMe(@ActiveUser() userId: number, @Body() dto: UpdateSellerProfileDto) {
    return this.sellerService.updateMyProfile(userId, dto);
  }

  @Post('me/documents')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadSellerDocumentDto })
  @ApiOkResponse({ type: SellerProfileResponseDto })
  @UseInterceptors(FileInterceptor('file', sellerDocumentMulter))
  uploadDocument(
    @ActiveUser() userId: number,
    @Body() dto: UploadSellerDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.sellerService.uploadDocument(userId, dto.type, file);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: SellerProfileResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sellerService.getProfileById(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: SellerProfileResponseDto })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveSellerProfileDto,
  ) {
    return this.sellerService.approveProfile(id, dto);
  }

  @Patch(':id/reject')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: SellerProfileResponseDto })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectSellerProfileDto,
  ) {
    return this.sellerService.rejectProfile(id, dto);
  }

  @Patch(':id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: SellerProfileResponseDto })
  suspend(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SuspendSellerProfileDto,
  ) {
    return this.sellerService.suspendProfile(id, dto);
  }
}

@ApiTags('seller')
@ApiBearerAuth('access-token')
@Controller('seller-profiles')
export class SellerProfilesController {
  constructor(private readonly sellerService: SellerService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll(@Query() query: QuerySellerProfilesDto) {
    return this.sellerService.listProfiles(query);
  }
}
