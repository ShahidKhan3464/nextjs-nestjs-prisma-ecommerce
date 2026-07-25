import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { GetProductsProvider } from './get-products.provider';
import { ProductFileType } from '../constants/product.constants';
import { DeleteProductProvider } from './delete-product.provider';
import { ProductWithRelations } from 'src/common/types/domain.types';
import { ProductOwnershipProvider } from './product-ownership.provider';
import { buildProductStoredFileData } from '../utils/build-product-stored-file.util';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ProductImagesProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly getProductsProvider: GetProductsProvider,
    private readonly deleteProductProvider: DeleteProductProvider,
    private readonly productOwnershipProvider: ProductOwnershipProvider,
  ) {}

  public async addImages(
    productId: number,
    files: Express.Multer.File[],
    userId: number,
    roles: UserRole[],
  ): Promise<ProductWithRelations> {
    if (!files?.length) {
      throw new BadRequestException('No image files provided');
    }

    await this.productOwnershipProvider.assertCanManage(
      productId,
      userId,
      roles,
    );

    await this.prisma.$transaction(async (tx) => {
      const aggregate = await tx.productFile.aggregate({
        where: { productId },
        _max: { sortOrder: true },
      });
      const maxSort = aggregate._max.sortOrder ?? -1;

      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const storedFile = await tx.storedFile.create({
          data: buildProductStoredFileData(file),
        });

        await tx.productFile.create({
          data: {
            productId,
            fileId: storedFile.id,
            type: ProductFileType.GALLERY,
            sortOrder: maxSort + 1 + index,
          },
        });
      }
    });

    return await this.getProductsProvider.findOne(productId);
  }

  public async removeImage(
    productId: number,
    imageId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<void> {
    await this.productOwnershipProvider.assertCanManage(
      productId,
      userId,
      roles,
    );

    const entry = await this.prisma.productFile.findFirst({
      where: {
        productId,
        fileId: imageId,
      },
      include: { file: true },
    });

    if (!entry) {
      throw new NotFoundException('Image not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.productFile.delete({ where: { id: entry.id } });
      await tx.storedFile.delete({ where: { id: entry.fileId } });
    });

    await this.deleteProductProvider.safeUnlinkStorageKey(
      entry.file.storageKey,
    );
  }
}
