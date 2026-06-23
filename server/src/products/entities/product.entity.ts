import { ProductVariant } from './product-variant.entity';
import { ProductStatus } from '../constants/product.constants';
import { Category } from 'src/categories/entities/category.entity';
import { StoredFile } from 'src/common/files/entities/stored-file.entity';

import {
  Index,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 255,
    type: 'varchar',
  })
  name: string;

  @Column({
    length: 255,
    type: 'varchar',
    unique: true,
    nullable: true,
  })
  slug: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  basePrice: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  @Index()
  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  /** Mapped via `joinProductImages` — not a direct TypeORM relation column. */
  images?: StoredFile[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (this.name) {
      this.slug = this.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }
}
