import { OrdersService } from './orders.service';
import { QueryOrderDto } from './dto/query-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/constants/user.constants';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CancelCheckoutDto } from './dto/cancel-checkout.dto';
import { CompleteCheckoutDto } from './dto/complete-checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';

@ApiTags('orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findMine(@ActiveUser() userId: number, @Query() query: QueryOrderDto) {
    return this.ordersService.findMine(userId, query);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  findAllAdmin(@Query() query: QueryOrderDto) {
    return this.ordersService.findAllAdmin(query);
  }

  @Post('checkout')
  createCheckout(@ActiveUser() userId: number, @Body() dto: CreateCheckoutDto) {
    return this.ordersService.createCheckout(userId, dto);
  }

  @Post('checkout/complete')
  completeCheckout(
    @ActiveUser() userId: number,
    @Body() dto: CompleteCheckoutDto,
  ) {
    return this.ordersService.completeCheckout(userId, dto);
  }

  @Post('checkout/cancel')
  cancelCheckout(@ActiveUser() userId: number, @Body() dto: CancelCheckoutDto) {
    return this.ordersService.cancelCheckout(userId, dto);
  }

  @Get(':id')
  findOne(@ActiveUser() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id, userId);
  }

  @Post(':id/cancel')
  cancelOrder(
    @ActiveUser() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(id, userId, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
