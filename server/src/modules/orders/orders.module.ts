import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { GetOrderProvider } from './providers/get-order.provider';
import { GetOrdersProvider } from './providers/get-orders.provider';
import { StripeModule } from 'src/integrations/stripe/stripe.module';
import { PaymentsModule } from 'src/modules/payments/payments.module';
import { CancelOrderProvider } from './providers/cancel-order.provider';
import { StripeWebhookProvider } from './providers/stripe-webhook.provider';
import { CreateCheckoutProvider } from './providers/create-checkout.provider';
import { CancelCheckoutProvider } from './providers/cancel-checkout.provider';
import { OrderOwnershipProvider } from './providers/order-ownership.provider';
import { CompleteCheckoutProvider } from './providers/complete-checkout.provider';
import { NotificationModule } from 'src/modules/notifications/notification.module';
import { UpdateOrderStatusProvider } from './providers/update-order-status.provider';

@Module({
  imports: [UsersModule, PaymentsModule, StripeModule, NotificationModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    GetOrderProvider,
    GetOrdersProvider,
    CancelOrderProvider,
    StripeWebhookProvider,
    OrderOwnershipProvider,
    CreateCheckoutProvider,
    CancelCheckoutProvider,
    CompleteCheckoutProvider,
    UpdateOrderStatusProvider,
  ],
})
export class OrdersModule {}
