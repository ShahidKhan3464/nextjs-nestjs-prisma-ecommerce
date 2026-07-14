import { extname } from 'path';
import { unlink } from 'fs/promises';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadSubdir } from 'src/common/storage/uploads-root';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  SellerDocumentType,
  SellerProfileStatus,
  SELLER_PROFILE_INCLUDE,
} from '../constants/seller.constants';
import {
  SellerProfileMapped,
  mapSellerProfileToResponse,
} from '../utils/map-seller-profile.util';

@Injectable()
export class UploadSellerDocumentProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async upload(
    userId: number,
    type: SellerDocumentType,
    file: Express.Multer.File,
  ): Promise<SellerProfileMapped> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const profile = await this.prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    if (
      profile.status === SellerProfileStatus.SUSPENDED ||
      profile.status === SellerProfileStatus.REJECTED
    ) {
      throw new ForbiddenException(
        'Documents cannot be uploaded for rejected or suspended profiles',
      );
    }

    const extension =
      extname(file.originalname).replace('.', '').toLowerCase() ||
      extname(file.filename).replace('.', '').toLowerCase() ||
      'bin';

    const storageKey = `${UploadSubdir.SELLERS}/${file.filename}`;
    const urlPath = `/uploads/${UploadSubdir.SELLERS}/${file.filename}`;

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const storedFile = await tx.storedFile.create({
          data: {
            urlPath,
            extension,
            storageKey,
            fileSize: file.size,
            mimeType: file.mimetype,
            storedName: file.filename,
            originalName: file.originalname,
          },
        });

        await tx.sellerDocument.create({
          data: {
            type,
            fileId: storedFile.id,
            sellerProfileId: profile.id,
          },
        });

        const result = await tx.sellerProfile.findFirst({
          where: { id: profile.id, deletedAt: null },
          include: SELLER_PROFILE_INCLUDE,
        });

        if (!result) {
          throw new NotFoundException('Seller profile not found');
        }

        return result;
      });

      return mapSellerProfileToResponse(updated);
    } catch (error) {
      try {
        await unlink(file.path);
      } catch {
        /* ignore cleanup errors */
      }
      throw error;
    }
  }
}
