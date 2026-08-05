import { PaymentWithRelations } from 'src/common/types/domain.types';
import { PaymentProvider, PaymentStatus } from '../constants/payment.constants';

export type PaymentOrderSummary = {
  id: string;
  userId: string;
  storeId: string;
  orderNumber: string;
};

export type PaymentResponse = {
  id: string;
  amount: number;
  orderId: string;
  paidAt?: string;
  currency: string;
  updatedAt: string;
  createdAt: string;
  refundedAt?: string;
  status: PaymentStatus;
  refundReason?: string;
  refundedAmount: number;
  transactionId?: string;
  methodSummary?: string;
  failureReason?: string;
  provider: PaymentProvider;
  externalRefundId?: string;
  order?: PaymentOrderSummary;
};

export type MapPaymentOptions = {
  /** Include failure reason (buyer/seller/admin when payment failed or cancelled). */
  includeFailureReason?: boolean;
  /** Include refund details when any refund amount exists. */
  includeRefundDetails?: boolean;
};

type PaymentOrderSource = {
  id: number;
  orderNumber: string;
  storeId: number;
  userId: number;
};

export type PaymentWithOrder = PaymentWithRelations & {
  order?: PaymentOrderSource;
};
