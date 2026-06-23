import { ConfigModule } from '@nestjs/config';
import { OrdersService } from './orders.service';
import { AuthModule } from 'src/auth/auth.module';
import { Module, forwardRef } from '@nestjs/common';
import stripeConfig from 'src/config/stripe.config';
import { UsersModule } from 'src/users/users.module';
import { OrdersController } from './orders.controller';
import { GetOrderProvider } from './providers/get-order.provider';
import { GetOrdersProvider } from './providers/get-orders.provider';
import { CancelOrderProvider } from './providers/cancel-order.provider';
import { CreateCheckoutProvider } from './providers/create-checkout.provider';
import { CancelCheckoutProvider } from './providers/cancel-checkout.provider';
import { CompleteCheckoutProvider } from './providers/complete-checkout.provider';
import { UpdateOrderStatusProvider } from './providers/update-order-status.provider';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    ConfigModule.forFeature(stripeConfig),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    GetOrderProvider,
    GetOrdersProvider,
    CancelOrderProvider,
    CreateCheckoutProvider,
    CancelCheckoutProvider,
    CompleteCheckoutProvider,
    UpdateOrderStatusProvider,
  ],
})
export class OrdersModule {}
