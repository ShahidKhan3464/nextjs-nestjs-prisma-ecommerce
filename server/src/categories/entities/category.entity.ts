import { Product } from 'src/products/entities/product.entity';
import {
  Column,
  Entity,
  OneToMany,
  UpdateDateColumn,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 255,
    type: 'varchar',
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
