import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { OrderStatus } from 'src/orders/constants/order.constants';
import type { OrderResponse } from 'src/orders/utils/map-order.util';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  public async sendWelcomeEmail(email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Our Store',
      template: 'welcome',
      context: { name },
    });
  }

  public async sendResetPasswordEmail(
    email: string,
    name: string,
    resetUrl: string,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Request',
      template: 'reset-password',
      context: { name, resetUrl },
    });
  }

  public async sendOrderConfirmationEmail(
    email: string,
    name: string,
    order: OrderResponse,
  ) {
    const items = order.items.map((item) => ({
      productName: item.productName,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      lineTotal: (item.priceAtPurchase * item.quantity).toFixed(2),
    }));

    await this.mailerService.sendMail({
      to: email,
      subject: `Order confirmed — ${order.orderNumber}`,
      template: 'order-confirmation',
      context: {
        name,
        items,
        orderNumber: order.orderNumber,
        total: order.total.toFixed(2),
      },
    });
  }

  public async sendOrderStatusUpdateEmail(
    email: string,
    name: string,
    order: OrderResponse,
    status: OrderStatus,
  ) {
    const statusLabel =
      status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ');

    await this.mailerService.sendMail({
      to: email,
      subject: `Order ${order.orderNumber} — ${statusLabel}`,
      template: 'order-status-update',
      context: {
        name,
        statusLabel,
        orderNumber: order.orderNumber,
        total: order.total.toFixed(2),
        paymentMethodSummary: order.paymentMethodSummary,
      },
    });
  }
}
