import { PrismaService } from 'src/prisma/prisma.service';
import type { OrderResponse } from '../types/order.types';
import { UserRole } from 'src/common/enums/user-role.enum';
import { OrderStatus } from '../constants/order.constants';
import { mapOrderToResponse } from '../utils/map-order.util';
import { UsersService } from 'src/modules/users/users.service';
import { AuditProvider } from 'src/common/audit/audit.provider';
import { MailService } from 'src/integrations/mail/mail.service';
import { OrderOwnershipProvider } from './order-ownership.provider';
import { findOrderWithImages } from 'src/common/prisma/file-query.util';
import { AuditAction, AuditEntityType } from 'src/common/audit/audit.constants';
import { NotificationService } from 'src/modules/notifications/notification.service';
import { NotificationType } from 'src/modules/notifications/constants/notification.constants';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  canTransitionOrderStatus,
  assertOrderCanEnterShipped,
} from '../utils/order-status-transitions.util';

@Injectable()
export class UpdateOrderStatusProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly auditProvider: AuditProvider,
    private readonly notificationService: NotificationService,
    private readonly orderOwnershipProvider: OrderOwnershipProvider,
  ) {}

  async update(
    orderId: number,
    status: OrderStatus,
    userId: number,
    roles: UserRole[],
  ): Promise<OrderResponse> {
    const order = await findOrderWithImages(this.prisma, { id: orderId });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.orderOwnershipProvider.assertCanManageStatus(
      order,
      userId,
      roles,
    );

    const allowed = canTransitionOrderStatus(order.status, status);
    if (!allowed) {
      throw new BadRequestException(
        `Cannot transition order from ${order.status} to ${status}`,
      );
    }

    if (status === OrderStatus.SHIPPED) {
      assertOrderCanEnterShipped({
        paymentStatus: order.payment?.status,
        paymentProvider: order.payment?.provider,
      });
    }

    const previousStatus = order.status;

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === OrderStatus.SHIPPED && !order.shippedAt
          ? { shippedAt: new Date() }
          : {}),
        ...(status === OrderStatus.DELIVERED && !order.deliveredAt
          ? { deliveredAt: new Date() }
          : {}),
      },
    });

    order.status = updated.status as OrderStatus;
    order.shippedAt = updated.shippedAt;
    order.deliveredAt = updated.deliveredAt;
    order.updatedAt = updated.updatedAt;

    const response = mapOrderToResponse(order, {
      includeBuyer: this.orderOwnershipProvider.shouldIncludeBuyer(roles),
    });

    if (previousStatus !== status) {
      this.auditProvider.record({
        action: AuditAction.ORDER_STATUS_UPDATED,
        entityType: AuditEntityType.ORDER,
        entityId: orderId,
        before: { status: previousStatus },
        after: { status },
      });

      const customer = await this.usersService.findOneById(order.userId);
      if (customer?.email) {
        void this.mailService
          .sendOrderStatusUpdateEmail(
            customer.email,
            customer.fullName,
            response,
            status,
          )
          .catch(() => undefined);
      }

      if (status === OrderStatus.SHIPPED) {
        void this.notificationService
          .create({
            userId: order.userId,
            type: NotificationType.ORDER_SHIPPED,
            title: 'Order shipped',
            message: `Your order #${order.id} has been shipped.`,
          })
          .catch(() => undefined);
      } else if (status === OrderStatus.DELIVERED) {
        void this.notificationService
          .create({
            userId: order.userId,
            type: NotificationType.ORDER_DELIVERED,
            title: 'Order delivered',
            message: `Your order #${order.id} has been delivered. We'd love your review!`,
          })
          .catch(() => undefined);
      }
    }

    return response;
  }
}
