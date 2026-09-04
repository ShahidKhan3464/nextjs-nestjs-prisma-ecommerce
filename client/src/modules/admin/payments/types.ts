export type PaymentStatus =
  | "FAILED"
  | "PENDING"
  | "REFUNDED"
  | "SUCCEEDED"
  | "CANCELLED"
  | "PROCESSING"
  | "PARTIALLY_REFUNDED";

export type PaymentProvider = "STRIPE" | "COD" | "OTHER";

export type PaymentStatusFilter = PaymentStatus | "ALL";
export type PaymentProviderFilter = PaymentProvider | "ALL";

export type PaymentOrderSummary = {
  id: string;
  userId: string;
  storeId: string;
  orderNumber: string;
};

export type Payment = {
  id: string;
  amount: number;
  orderId: string;
  paidAt?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  refundedAt?: string;
  status: PaymentStatus;
  refundReason?: string;
  refundedAmount: number;
  transactionId?: string;
  methodSummary?: string;
  failureReason?: string;
  externalRefundId?: string;
  provider: PaymentProvider;
  order?: PaymentOrderSummary;
};

export type PaymentListParams = {
  page?: number;
  limit?: number;
  userId?: string;
  orderId?: string;
  storeId?: string;
  hasRefund?: boolean;
  hasFailure?: boolean;
  status?: PaymentStatus;
  transactionId?: string;
  provider?: PaymentProvider;
};

export type PaymentListResult = {
  data: Payment[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
};

export type RecordRefundInput = {
  reason: string;
  amount?: number;
  externalRefundId?: string;
};

export type RejectCodInput = {
  reason?: string;
};
