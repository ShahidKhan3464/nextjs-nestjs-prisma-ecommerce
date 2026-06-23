import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoredFile } from './entities/stored-file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StoredFile])],
  exports: [TypeOrmModule],
})
export class FilesModule {}
