import { UserRole } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { ProductVariantsService } from './product-variants.service';
import { AuthType } from 'src/modules/auth/constants/auth.constants';
import { QueryProductVariantDto } from './dto/query-product-variant.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import {
  ProductVariantResponseDto,
  PaginatedProductVariantResponseDto,
} from './dto/product-variant-response.dto';
import {
  ApiTags,
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
  @ApiOkResponse({ type: PaginatedProductVariantResponseDto })
  findMine(
    @ActiveUser() userId: number,
    @Query() query: QueryProductVariantDto,
  ) {
    return this.productVariantsService.findMinePaginated(userId, query);
  }

  /** Public catalog list. Sellers manage inventory via `GET /product-variants/me`. */
  @Get()
  @Auth(AuthType.NONE)
  @ApiOkResponse({ type: PaginatedProductVariantResponseDto })
  findAll(@Query() query: QueryProductVariantDto) {
    return this.productVariantsService.findAllPaginated(query);
  }

  @Get('product/:productId')
  @Auth(AuthType.NONE)
  @ApiOkResponse({ type: PaginatedProductVariantResponseDto })
  findByProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: QueryProductVariantDto,
  ) {
    return this.productVariantsService.findByProductId(productId, query);
  }

  @Get(':id')
  @Auth(AuthType.NONE)
  @ApiOkResponse({ type: ProductVariantResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productVariantsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiCreatedResponse({ type: ProductVariantResponseDto })
  create(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.productVariantsService.create(dto, userId, roles);
  }

  @Patch(':id')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: ProductVariantResponseDto })
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
