import { Injectable } from '@nestjs/common';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { RecordRefundDto } from './dto/record-refund.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { RejectCodPaymentDto } from './dto/reject-cod-payment.dto';
import { GetPaymentProvider } from './providers/get-payment.provider';
import { GetPaymentsProvider } from './providers/get-payments.provider';
import { RecordRefundProvider } from './providers/record-refund.provider';
import { RejectCodPaymentProvider } from './providers/reject-cod-payment.provider';
import { ConfirmCodPaymentProvider } from './providers/confirm-cod-payment.provider';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly getPaymentProvider: GetPaymentProvider,
    private readonly getPaymentsProvider: GetPaymentsProvider,
    private readonly recordRefundProvider: RecordRefundProvider,
    private readonly rejectCodPaymentProvider: RejectCodPaymentProvider,
    private readonly confirmCodPaymentProvider: ConfirmCodPaymentProvider,
  ) {}

  findMine(userId: number, query: QueryPaymentDto) {
    return this.getPaymentsProvider.findByUser(userId, query);
  }

  findSellerPayments(userId: number, query: QueryPaymentDto) {
    return this.getPaymentsProvider.findBySeller(userId, query);
  }

  findAllAdmin(query: QueryPaymentDto) {
    return this.getPaymentsProvider.findAll(query);
  }

  findOne(paymentId: number, userId: number, roles: UserRole[]) {
    return this.getPaymentProvider.findOne(paymentId, userId, roles);
  }

  confirmCod(paymentId: number, userId: number, roles: UserRole[]) {
    return this.confirmCodPaymentProvider.confirm(paymentId, userId, roles);
  }

  rejectCod(
    paymentId: number,
    userId: number,
    roles: UserRole[],
    dto: RejectCodPaymentDto,
  ) {
    return this.rejectCodPaymentProvider.reject(
      paymentId,
      userId,
      roles,
      dto.reason,
    );
  }

  recordRefund(paymentId: number, roles: UserRole[], dto: RecordRefundDto) {
    return this.recordRefundProvider.record(paymentId, roles, dto);
  }
}
