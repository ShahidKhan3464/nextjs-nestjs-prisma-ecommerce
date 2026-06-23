import { User } from 'src/users/entities/user.entity';
import { ProductVariant } from 'src/products/entities/product-variant.entity';
import {
  Column,
  Entity,
  Unique,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('cart_items')
@Unique(['userId', 'productVariantId'])
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  productVariantId: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productVariantId' })
  variant: ProductVariant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
