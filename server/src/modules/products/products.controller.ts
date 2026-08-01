import { ProductsService } from './products.service';
import { QueryProductDto } from './dto/query-product.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { AuthType } from 'src/modules/auth/constants/auth.constants';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { ParseProductImagesPipe } from './pipes/parse-product-images.pipe';
import { createImageDiskMulterOptions } from 'src/integrations/storage/multer/image-upload.multer';
import {
  ProductResponseDto,
  PaginatedProductResponseDto,
} from './dto/product-response.dto';
import {
  getUploadsRoot,
  UploadSubdir,
} from 'src/integrations/storage/uploads-root';
import {
  ApiTags,
  ApiConsumes,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import {
  Get,
  Body,
  Post,
  Param,
  Patch,
  Query,
  Delete,
  Controller,
  ParseIntPipe,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

const imagesMulter = createImageDiskMulterOptions(
  getUploadsRoot(),
  UploadSubdir.PRODUCTS,
);

@ApiTags('products')
@ApiBearerAuth('access-token')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('me')
  @Roles(UserRole.SELLER)
  @ApiOkResponse({ type: PaginatedProductResponseDto })
  findMine(@ActiveUser() userId: number, @Query() query: QueryProductDto) {
    return this.productsService.findMinePaginated(userId, query);
  }

  /** Catalog / admin list. Sellers manage their catalog via `GET /products/me`. */
  @Get()
  @Auth(AuthType.NONE)
  @ApiOkResponse({ type: PaginatedProductResponseDto })
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAllPaginated(query);
  }

  @Get('detail/:slug')
  @Auth(AuthType.NONE)
  @ApiOkResponse({ type: ProductResponseDto })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  @Auth(AuthType.NONE)
  @ApiOkResponse({ type: ProductResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 12, imagesMulter))
  @ApiCreatedResponse({ type: ProductResponseDto })
  create(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() body: CreateProductDto,
    @UploadedFiles(ParseProductImagesPipe)
    files: Express.Multer.File[],
  ) {
    return this.productsService.create(body, files ?? [], userId, roles);
  }

  @Patch(':id')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('images', 12, imagesMulter))
  @ApiOkResponse({ type: ProductResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productsService.update(id, dto, files ?? [], userId, roles);
  }

  @Patch(':id/publish')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: ProductResponseDto })
  publish(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
  ) {
    return this.productsService.publish(id, userId, roles);
  }

  @Patch(':id/archive')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: ProductResponseDto })
  archive(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
  ) {
    return this.productsService.archive(id, userId, roles);
  }

  @Delete(':id')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
  ) {
    return this.productsService.remove(id, userId, roles);
  }

  @Patch(':id/restore')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: ProductResponseDto })
  restore(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
  ) {
    return this.productsService.restore(id, userId, roles);
  }
}
