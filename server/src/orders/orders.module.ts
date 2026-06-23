import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';
import { AuthModule } from 'src/auth/auth.module';
import { Module, forwardRef } from '@nestjs/common';
import stripeConfig from 'src/config/stripe.config';
import { UsersModule } from 'src/users/users.module';
import { OrdersController } from './orders.controller';
import { OrderItem } from './entities/order-item.entity';
import { FilesModule } from 'src/common/files/files.module';
import { CartItem } from 'src/cart/entities/cart-item.entity';
import { GetOrderProvider } from './providers/get-order.provider';
import { GetOrdersProvider } from './providers/get-orders.provider';
import { CheckoutSession } from './entities/checkout-session.entity';
import { CancelOrderProvider } from './providers/cancel-order.provider';
import { CreateCheckoutProvider } from './providers/create-checkout.provider';
import { CheckoutSessionItem } from './entities/checkout-session-item.entity';
import { CancelCheckoutProvider } from './providers/cancel-checkout.provider';
import { CompleteCheckoutProvider } from './providers/complete-checkout.provider';
import { UpdateOrderStatusProvider } from './providers/update-order-status.provider';

@Module({
  imports: [
    FilesModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    ConfigModule.forFeature(stripeConfig),
    TypeOrmModule.forFeature([
      Order,
      CartItem,
      OrderItem,
      CheckoutSession,
      CheckoutSessionItem,
    ]),
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
