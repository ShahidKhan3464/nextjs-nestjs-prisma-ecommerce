import { join } from 'path';
import { unlink } from 'fs/promises';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FileOwnerModule } from 'src/common/files/file.constants';
import { StoredFile } from 'src/common/files/entities/stored-file.entity';

@Injectable()
export class UploadProfileAvatarProvider {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(StoredFile)
    private readonly fileRepository: Repository<StoredFile>,
  ) {}

  async upload(userId: number, file: Express.Multer.File): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.fileRepository.find({
      where: { ownerModule: FileOwnerModule.CUSTOMER, ownerId: userId },
    });

    await Promise.all(
      existing.map(async (img) => {
        const relative = img.urlPath.replace(/^\//, '');
        const abs = join(process.cwd(), relative);
        try {
          await unlink(abs);
        } catch {
          /* ignore */
        }
      }),
    );

    if (existing.length) {
      await this.fileRepository.remove(existing);
    }

    const urlPath = `/uploads/customers/${file.filename}`;
    await this.fileRepository.save(
      this.fileRepository.create({
        urlPath,
        sortOrder: 0,
        ownerModule: FileOwnerModule.CUSTOMER,
        ownerId: userId,
      }),
    );

    return urlPath;
  }
}
