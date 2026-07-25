import { PaymentsService } from './payments.service';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { RecordRefundDto } from './dto/record-refund.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { RejectCodPaymentDto } from './dto/reject-cod-payment.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import {
  Get,
  Post,
  Body,
  Param,
  Query,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';

@ApiTags('payments')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List payments for the authenticated buyer' })
  @ApiOkResponse({ type: PaymentResponseDto, isArray: true })
  findMine(@ActiveUser() userId: number, @Query() query: QueryPaymentDto) {
    return this.paymentsService.findMine(userId, query);
  }

  @Get('seller')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'List payments for the seller store orders' })
  findSellerPayments(
    @ActiveUser() userId: number,
    @Query() query: QueryPaymentDto,
  ) {
    return this.paymentsService.findSellerPayments(userId, query);
  }

  @Get('admin/all')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List all payments with filters (admin)',
  })
  findAllAdmin(@Query() query: QueryPaymentDto) {
    return this.paymentsService.findAllAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by id' })
  @ApiOkResponse({ type: PaymentResponseDto })
  findOne(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.paymentsService.findOne(id, userId, roles);
  }

  @Post(':id/cod/confirm')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Confirm a COD payment (seller of the store or admin)',
  })
  @ApiOkResponse({ type: PaymentResponseDto })
  confirmCod(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.paymentsService.confirmCod(id, userId, roles);
  }

  @Post(':id/cod/reject')
  @Roles(UserRole.SELLER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Reject a COD payment (seller of the store or admin)',
  })
  @ApiOkResponse({ type: PaymentResponseDto })
  rejectCod(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectCodPaymentDto,
  ) {
    return this.paymentsService.rejectCod(id, userId, roles, dto);
  }

  @Post(':id/refunds')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Record a full or partial refund on a payment (tracking only; does not call Stripe)',
  })
  @ApiOkResponse({ type: PaymentResponseDto })
  recordRefund(
    @ActiveUser('roles') roles: UserRole[],
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordRefundDto,
  ) {
    return this.paymentsService.recordRefund(id, roles, dto);
  }
}
