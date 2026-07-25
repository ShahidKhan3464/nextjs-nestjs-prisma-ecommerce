import { CartService } from './cart.service';
import { SyncCartDto } from './dto/sync-cart.dto';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItemResponseDto } from './dto/cart-item-response.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
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
  Patch,
  Param,
  Delete,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';

@ApiTags('cart')
@ApiBearerAuth('access-token')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOkResponse({ type: CartItemResponseDto, isArray: true })
  findAll(@ActiveUser() userId: number) {
    return this.cartService.findAll(userId);
  }

  @Post('sync')
  @ApiOkResponse({ type: CartItemResponseDto, isArray: true })
  sync(@ActiveUser() userId: number, @Body() dto: SyncCartDto) {
    return this.cartService.sync(userId, dto);
  }

  @Post()
  @ApiCreatedResponse({ type: CartItemResponseDto })
  add(@ActiveUser() userId: number, @Body() dto: AddCartItemDto) {
    return this.cartService.add(userId, dto);
  }

  @Patch('items/:variantId')
  @ApiOkResponse({ type: CartItemResponseDto })
  update(
    @ActiveUser() userId: number,
    @Param('variantId', ParseIntPipe) variantId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.update(userId, variantId, dto);
  }

  @Delete('items/:variantId')
  remove(
    @ActiveUser() userId: number,
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return this.cartService.remove(userId, variantId);
  }

  @Delete()
  clear(@ActiveUser() userId: number) {
    return this.cartService.clear(userId);
  }
}
