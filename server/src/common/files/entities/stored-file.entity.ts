import { FileOwnerModule } from '../file.constants';
import {
  Column,
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('files')
export class StoredFile {
  @PrimaryGeneratedColumn()
  id: number;

  /** Public URL path, e.g. `/uploads/products/filename.jpg` */
  @Column({ type: 'varchar', length: 512 })
  urlPath: string;

  @Column({ type: 'enum', enum: FileOwnerModule })
  ownerModule: FileOwnerModule;

  @Column({ type: 'int' })
  ownerId: number;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}
