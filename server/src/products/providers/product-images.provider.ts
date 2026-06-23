import { ProductWithRelations } from 'src/common/types/domain.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetProductsProvider } from './get-products.provider';
import { DeleteProductProvider } from './delete-product.provider';
import { FileOwnerModule } from 'src/common/files/file.constants';
import {
  Inject,
  Injectable,
  forwardRef,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ProductImagesProvider {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => GetProductsProvider))
    private readonly getProductsProvider: GetProductsProvider,
    private readonly deleteProductProvider: DeleteProductProvider,
  ) {}

  public async addImages(
    productId: number,
    files: Express.Multer.File[],
  ): Promise<ProductWithRelations> {
    if (!files?.length) {
      throw new BadRequestException('No image files provided');
    }
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const aggregate = await this.prisma.storedFile.aggregate({
      where: {
        ownerModule: FileOwnerModule.PRODUCT,
        ownerId: productId,
      },
      _max: { sortOrder: true },
    });
    const maxSort = aggregate._max.sortOrder ?? -1;

    await this.prisma.storedFile.createMany({
      data: files.map((file, index) => ({
        urlPath: `/uploads/products/${file.filename}`,
        sortOrder: maxSort + 1 + index,
        ownerModule: FileOwnerModule.PRODUCT,
        ownerId: productId,
      })),
    });

    return await this.getProductsProvider.findOne(productId);
  }

  public async removeImage(productId: number, imageId: number): Promise<void> {
    const image = await this.prisma.storedFile.findFirst({
      where: {
        id: imageId,
        ownerModule: FileOwnerModule.PRODUCT,
        ownerId: productId,
      },
    });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    await this.deleteProductProvider.safeUnlinkPublicPath(image.urlPath);
    await this.prisma.storedFile.delete({ where: { id: imageId } });
  }
}
