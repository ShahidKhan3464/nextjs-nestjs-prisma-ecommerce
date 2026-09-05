import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { SkipThrottle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import { QueryOrderDto } from './dto/query-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CancelCheckoutDto } from './dto/cancel-checkout.dto';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { CompleteCheckoutDto } from './dto/complete-checkout.dto';
import { AuthType } from 'src/modules/auth/constants/auth.constants';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import {
  OrderResponseDto,
  PaginatedOrderResponseDto,
  CheckoutSessionResponseDto,
  CompleteCheckoutResponseDto,
} from './dto/order-response.dto';
import {
  ApiTags,
  ApiHeader,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import {
  Get,
  Req,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Headers,
  HttpCode,
  Controller,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';

@ApiTags('orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('webhooks/stripe')
  @Auth(AuthType.NONE)
  @SkipThrottle()
  @HttpCode(200)
  handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw request body');
    }
    return this.ordersService.handleStripeWebhook(req.rawBody, signature);
  }

  @Get()
  @ApiOkResponse({ type: PaginatedOrderResponseDto })
  findMine(@ActiveUser() userId: number, @Query() query: QueryOrderDto) {
    return this.ordersService.findMine(userId, query);
  }

  @Get('seller')
  @Roles(UserRole.SELLER)
  @ApiOkResponse({ type: PaginatedOrderResponseDto })
  findSellerOrders(
    @ActiveUser() userId: number,
    @Query() query: QueryOrderDto,
  ) {
    return this.ordersService.findSellerOrders(userId, query);
  }

  @Get('admin/all')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: PaginatedOrderResponseDto })
  findAllAdmin(@Query() query: QueryOrderDto) {
    return this.ordersService.findAllAdmin(query);
  }

  @Post('checkout')
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description:
      'Required unless idempotencyKey is sent in the body. At least one must be present.',
  })
  @ApiCreatedResponse({ type: CheckoutSessionResponseDto })
  createCheckout(
    @ActiveUser() userId: number,
    @Body() dto: CreateCheckoutDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.ordersService.createCheckout(userId, dto, idempotencyKey);
  }

  @Post('checkout/complete')
  @ApiOkResponse({ type: CompleteCheckoutResponseDto })
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
  @ApiOkResponse({ type: OrderResponseDto })
  findOne(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.findOne(id, userId, roles);
  }

  @Post(':id/cancel')
  @ApiOkResponse({ type: OrderResponseDto })
  cancelOrder(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(id, userId, roles, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: OrderResponseDto })
  updateStatus(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto, userId, roles);
  }
}
