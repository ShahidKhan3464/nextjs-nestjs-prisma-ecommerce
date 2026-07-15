import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ProductVariantsService } from './product-variants.service';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { QueryProductVariantDto } from './dto/query-product-variant.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
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
} from '@nestjs/common';

@ApiTags('product-variants')
@ApiBearerAuth('access-token')
@Controller('product-variants')
export class ProductVariantsController {
  constructor(
    private readonly productVariantsService: ProductVariantsService,
  ) {}

  @Get('me')
  @Roles(UserRole.SELLER)
  findMine(
    @ActiveUser() userId: number,
    @Query() query: QueryProductVariantDto,
  ) {
    return this.productVariantsService.findMinePaginated(userId, query);
  }

  /** Catalog / admin list. Sellers manage inventory via `GET /product-variants/me`. */
  @Get()
  findAll(@Query() query: QueryProductVariantDto) {
    return this.productVariantsService.findAllPaginated(query);
  }

  @Get('product/:productId')
  findByProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: QueryProductVariantDto,
  ) {
    return this.productVariantsService.findByProductId(productId, query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productVariantsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  create(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.productVariantsService.create(dto, userId, roles);
  }

  @Patch(':id')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productVariantsService.update(id, dto, userId, roles);
  }

  @Delete(':id')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
  ) {
    return this.productVariantsService.remove(id, userId, roles);
  }
}
