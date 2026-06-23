import { join } from 'path';
import { unlink } from 'fs/promises';
import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FileOwnerModule } from 'src/common/files/file.constants';

@Injectable()
export class UploadProfileAvatarProvider {
  constructor(private readonly prisma: PrismaService) {}

  async upload(userId: number, file: Express.Multer.File): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.storedFile.findMany({
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
      await this.prisma.storedFile.deleteMany({
        where: { ownerModule: FileOwnerModule.CUSTOMER, ownerId: userId },
      });
    }

    const urlPath = `/uploads/customers/${file.filename}`;
    await this.prisma.storedFile.create({
      data: {
        urlPath,
        sortOrder: 0,
        ownerModule: FileOwnerModule.CUSTOMER,
        ownerId: userId,
      },
    });

    return urlPath;
  }
}
