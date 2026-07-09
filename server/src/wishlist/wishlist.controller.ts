import { WishlistService } from './wishlist.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SyncWishlistDto } from './dto/sync-wishlist.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import {
  Get,
  Body,
  Post,
  Param,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';

@ApiTags('wishlist')
@ApiBearerAuth('access-token')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  findAll(@ActiveUser() userId: number) {
    return this.wishlistService.findAll(userId);
  }

  @Post('sync')
  sync(@ActiveUser() userId: number, @Body() dto: SyncWishlistDto) {
    return this.wishlistService.sync(userId, dto);
  }

  @Post('toggle/:productId')
  toggle(
    @ActiveUser() userId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.wishlistService.toggle(userId, productId);
  }
}
