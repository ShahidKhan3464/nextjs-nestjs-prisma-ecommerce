import { Exclude } from 'class-transformer';
import { UserRole } from '../constants/user.constants';
import {
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 30,
    type: 'varchar',
    nullable: false,
  })
  fullName: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  phoneNumber: string;

  @Column({
    unique: true,
    type: 'varchar',
    nullable: false,
  })
  email: string;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  @Exclude()
  password: string;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  @Exclude()
  confirmPassword: string;

  @Column({
    default: false,
    type: 'boolean',
  })
  isBlocked: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @CreateDateColumn()
  createDate: Date;

  @UpdateDateColumn()
  updateDate: Date;
}
