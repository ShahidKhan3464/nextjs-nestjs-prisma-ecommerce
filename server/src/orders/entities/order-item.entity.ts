import { Order } from './order.entity';
import { ProductVariant } from 'src/products/entities/product-variant.entity';
import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  orderId: number;

  @Column({ type: 'int' })
  variantId: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAtPurchase: number;

  /** Snapshot of catalog image at purchase time (survives product removal). */
  @Column({ type: 'varchar', length: 512, nullable: true })
  imageUrl: string | null;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => ProductVariant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;
}
