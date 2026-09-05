import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import type { OrderResponse } from 'src/modules/orders/types/order.types';
import { OrderStatus } from 'src/modules/orders/constants/order.constants';
import { MAIL_SUBJECTS, MAIL_TEMPLATES } from './constants/mail.constants';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  public async sendWelcomeEmail(email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: MAIL_SUBJECTS.WELCOME,
      template: MAIL_TEMPLATES.WELCOME,
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
      subject: MAIL_SUBJECTS.RESET_PASSWORD,
      template: MAIL_TEMPLATES.RESET_PASSWORD,
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
      subject: MAIL_SUBJECTS.orderConfirmation(order.orderNumber),
      template: MAIL_TEMPLATES.ORDER_CONFIRMATION,
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
      subject: MAIL_SUBJECTS.orderStatusUpdate(order.orderNumber, statusLabel),
      template: MAIL_TEMPLATES.ORDER_STATUS_UPDATE,
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
