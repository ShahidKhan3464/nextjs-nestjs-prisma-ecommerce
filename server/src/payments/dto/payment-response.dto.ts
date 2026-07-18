import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider, PaymentStatus } from '../constants/payment.constants';

export class PaymentResponseDto {
  @ApiPropertyOptional()
  id: string;

  @ApiPropertyOptional()
  orderId: string;

  @ApiPropertyOptional({ enum: PaymentProvider })
  provider: PaymentProvider;

  @ApiPropertyOptional({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiPropertyOptional()
  amount: number;

  @ApiPropertyOptional()
  currency: string;

  @ApiPropertyOptional()
  refundedAmount: number;

  @ApiPropertyOptional()
  createdAt: string;

  @ApiPropertyOptional()
  updatedAt: string;

  @ApiPropertyOptional()
  transactionId?: string;

  @ApiPropertyOptional()
  methodSummary?: string;

  @ApiPropertyOptional()
  paidAt?: string;

  @ApiPropertyOptional()
  failureReason?: string;

  @ApiPropertyOptional()
  refundReason?: string;

  @ApiPropertyOptional()
  refundedAt?: string;

  @ApiPropertyOptional()
  externalRefundId?: string;
}
