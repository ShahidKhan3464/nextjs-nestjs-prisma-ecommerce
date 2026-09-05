import type { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { isSuperAdmin } from 'src/common/utils/authorization.util';
import { UserFileType, isPrivateStorageKey } from '../constants/file.constants';
import { LocalStorageProvider } from 'src/integrations/storage/providers/local-storage.provider';
import {
  Injectable,
  StreamableFile,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SecureFileAccessProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageProvider,
  ) {}

  public async streamSecureFile(
    fileId: number,
    userId: number,
    roles: UserRole[],
    res: Response,
  ): Promise<StreamableFile> {
    const file = await this.prisma.storedFile.findUnique({
      where: { id: fileId },
      include: {
        sellerDocuments: {
          select: {
            sellerProfile: { select: { userId: true } },
          },
        },
        userFiles: {
          select: { userId: true, type: true },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const isSellerDoc = file.sellerDocuments.length > 0;
    const privateUserDocs = file.userFiles.filter(
      (entry) => entry.type === UserFileType.DOCUMENT,
    );
    const isPrivate =
      isPrivateStorageKey(file.storageKey) ||
      isSellerDoc ||
      privateUserDocs.length > 0;

    if (!isPrivate) {
      throw new NotFoundException('File not found');
    }

    if (!isSuperAdmin(roles)) {
      const ownsSellerDoc = file.sellerDocuments.some(
        (doc) => doc.sellerProfile.userId === userId,
      );
      const ownsUserDoc = privateUserDocs.some(
        (entry) => entry.userId === userId,
      );

      if (!ownsSellerDoc && !ownsUserDoc) {
        throw new ForbiddenException('You do not have access to this file');
      }
    }

    const absolutePath = this.storage.resolveAbsolutePath(file.storageKey);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('File not found');
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.originalName)}"`,
    );
    res.setHeader('Cache-Control', 'private, no-store');

    const stream = createReadStream(absolutePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(404).end();
      } else {
        res.destroy();
      }
    });

    return new StreamableFile(stream);
  }
}
