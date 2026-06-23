import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { GetProductsProvider } from './get-products.provider';
import { DeleteProductProvider } from './delete-product.provider';
import { FileOwnerModule } from 'src/common/files/file.constants';
import { StoredFile } from 'src/common/files/entities/stored-file.entity';
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
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(StoredFile)
    private readonly fileRepository: Repository<StoredFile>,
    @Inject(forwardRef(() => GetProductsProvider))
    private readonly getProductsProvider: GetProductsProvider,
    private readonly deleteProductProvider: DeleteProductProvider,
  ) {}

  public async addImages(
    productId: number,
    files: Express.Multer.File[],
  ): Promise<Product> {
    if (!files?.length) {
      throw new BadRequestException('No image files provided');
    }
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const raw = await this.fileRepository
      .createQueryBuilder('file')
      .select('MAX(file.sortOrder)', 'max')
      .where('file.ownerModule = :module', { module: FileOwnerModule.PRODUCT })
      .andWhere('file.ownerId = :ownerId', { ownerId: productId })
      .getRawOne<{ max: string | null }>();
    const maxSort = raw?.max != null ? Number(raw.max) : -1;

    const entities = files.map((file, index) =>
      this.fileRepository.create({
        urlPath: `/uploads/products/${file.filename}`,
        sortOrder: maxSort + 1 + index,
        ownerModule: FileOwnerModule.PRODUCT,
        ownerId: productId,
      }),
    );
    await this.fileRepository.save(entities);
    return await this.getProductsProvider.findOne(productId);
  }

  public async removeImage(productId: number, imageId: number): Promise<void> {
    const image = await this.fileRepository.findOne({
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
    await this.fileRepository.remove(image);
  }
}
