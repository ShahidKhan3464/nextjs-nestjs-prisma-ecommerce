import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { GetPaymentProvider } from './providers/get-payment.provider';
import { GetPaymentsProvider } from './providers/get-payments.provider';
import { RecordRefundProvider } from './providers/record-refund.provider';
import { PaymentOwnershipProvider } from './providers/payment-ownership.provider';
import { PaymentLifecycleProvider } from './providers/payment-lifecycle.provider';
import { RejectCodPaymentProvider } from './providers/reject-cod-payment.provider';
import { ConfirmCodPaymentProvider } from './providers/confirm-cod-payment.provider';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    GetPaymentProvider,
    GetPaymentsProvider,
    RecordRefundProvider,
    PaymentOwnershipProvider,
    PaymentLifecycleProvider,
    RejectCodPaymentProvider,
    ConfirmCodPaymentProvider,
  ],
  exports: [PaymentLifecycleProvider],
})
export class PaymentsModule {}
