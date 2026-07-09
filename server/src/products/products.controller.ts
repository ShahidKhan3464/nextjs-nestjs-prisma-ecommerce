import { ProductsService } from './products.service';
import { QueryProductDto } from './dto/query-product.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiTags, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { ParseProductImagesPipe } from './pipes/parse-product-images.pipe';
import { getUploadsRoot, UploadSubdir } from 'src/common/storage/uploads-root';
import { createImageDiskMulterOptions } from 'src/common/storage/image-upload.multer';
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

  @Get()
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAllPaginated(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Get('detail/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 12, imagesMulter))
  create(
    @Body() body: CreateProductDto,
    @UploadedFiles(ParseProductImagesPipe)
    files: Express.Multer.File[],
  ) {
    return this.productsService.create(body, files ?? []);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('images', 12, imagesMulter))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productsService.update(id, dto, files ?? []);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN)
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.restore(id);
  }
}
