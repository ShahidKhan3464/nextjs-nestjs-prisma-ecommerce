import { User } from 'src/users/entities/user.entity';
import { CheckoutSessionItem } from './checkout-session-item.entity';
import {
  Column,
  Entity,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('checkout_sessions')
export class CheckoutSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'text' })
  shippingAddress: string;

  @Column({ type: 'varchar', length: 255 })
  stripePaymentIntentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => CheckoutSessionItem, (item) => item.session, {
    cascade: true,
  })
  items: CheckoutSessionItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
