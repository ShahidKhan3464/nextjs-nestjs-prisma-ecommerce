import { Product } from 'src/products/entities/product.entity';
import {
  Index,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 255,
    type: 'varchar',
  })
  size: string;

  @Column({
    length: 255,
    type: 'varchar',
  })
  color: string;

  @Index()
  @Column({
    unique: true,
  })
  sku: string;

  @Column({
    type: 'integer',
  })
  stock: number;

  @Column({
    scale: 2,
    precision: 10,
    type: 'decimal',
  })
  price: number;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
