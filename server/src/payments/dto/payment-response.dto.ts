import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider, PaymentStatus } from '../constants/payment.constants';

export class PaymentOrderSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  storeId: string;

  @ApiProperty()
  userId: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty({ enum: PaymentProvider })
  provider: PaymentProvider;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  refundedAmount: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
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

  @ApiPropertyOptional({ type: PaymentOrderSummaryDto })
  order?: PaymentOrderSummaryDto;
}
