import { CheckoutSession } from './checkout-session.entity';
import { ProductVariant } from 'src/products/entities/product-variant.entity';
import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('checkout_session_items')
export class CheckoutSessionItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  checkoutSessionId: number;

  @Column({ type: 'int' })
  variantId: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAtPurchase: number;

  @ManyToOne(() => CheckoutSession, (session) => session.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'checkoutSessionId' })
  session: CheckoutSession;

  @ManyToOne(() => ProductVariant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;
}
