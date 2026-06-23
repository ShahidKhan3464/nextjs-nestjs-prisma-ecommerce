import { In, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { UpdateProductDto } from '../dto/update-product.dto';
import { GetProductsProvider } from './get-products.provider';
import { FileOwnerModule } from 'src/common/files/file.constants';
import { DeleteProductProvider } from './delete-product.provider';
import { OrderItem } from 'src/orders/entities/order-item.entity';
import { Category } from 'src/categories/entities/category.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { StoredFile } from 'src/common/files/entities/stored-file.entity';
import { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import {
  Inject,
  Injectable,
  forwardRef,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class UpdateProductProvider {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(StoredFile)
    private readonly fileRepository: Repository<StoredFile>,
    @Inject(forwardRef(() => GetProductsProvider))
    private readonly getProductsProvider: GetProductsProvider,
    private readonly deleteProductProvider: DeleteProductProvider,
  ) {}

  public async update(
    id: number,
    dto: UpdateProductDto,
    files: Express.Multer.File[] = [],
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      product.category = category;
    }
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.status !== undefined) product.status = dto.status;
    if (dto.variants !== undefined) {
      await this.syncVariants(product, dto.variants);
    }

    await this.productRepository.save(product);

    if (dto.retainImagePaths !== undefined) {
      const keep = dto.retainImagePaths;
      const imagesToRemove = await this.fileRepository.find({
        where:
          keep.length === 0
            ? { ownerModule: FileOwnerModule.PRODUCT, ownerId: id }
            : {
                ownerModule: FileOwnerModule.PRODUCT,
                ownerId: id,
                urlPath: Not(In(keep)),
              },
      });
      await Promise.all(
        imagesToRemove.map((img) =>
          this.deleteProductProvider.safeUnlinkPublicPath(img.urlPath),
        ),
      );
      if (keep.length === 0) {
        await this.fileRepository.delete({
          ownerModule: FileOwnerModule.PRODUCT,
          ownerId: id,
        });
      } else {
        await this.fileRepository.delete({
          ownerModule: FileOwnerModule.PRODUCT,
          ownerId: id,
          urlPath: Not(In(keep)),
        });
      }
    }

    if (files.length > 0) {
      const existing = await this.fileRepository.find({
        where: { ownerModule: FileOwnerModule.PRODUCT, ownerId: id },
        order: { sortOrder: 'ASC' },
      });
      const nextOrder =
        existing.length > 0
          ? Math.max(...existing.map((img) => img.sortOrder)) + 1
          : 0;

      const imageEntities = files.map((file, index) =>
        this.fileRepository.create({
          urlPath: `/uploads/products/${file.filename}`,
          sortOrder: nextOrder + index,
          ownerModule: FileOwnerModule.PRODUCT,
          ownerId: id,
        }),
      );
      await this.fileRepository.save(imageEntities);
    }

    return await this.getProductsProvider.findOne(id);
  }

  private async syncVariants(
    product: Product,
    incoming: CreateProductVariantDto[],
  ): Promise<void> {
    const existing = await this.productVariantRepository.find({
      where: { product: { id: product.id } },
    });
    const existingBySku = new Map(
      existing.map((variant) => [variant.sku, variant]),
    );
    const incomingSkus = new Set(incoming.map((variant) => variant.sku));

    for (const variant of incoming) {
      if (existingBySku.has(variant.sku)) {
        continue;
      }

      const skuExists = await this.productVariantRepository.exists({
        where: { sku: variant.sku },
      });
      if (skuExists) {
        throw new ConflictException(`SKU "${variant.sku}" is already in use`);
      }
    }

    for (const variantDto of incoming) {
      const existingVariant = existingBySku.get(variantDto.sku);
      if (existingVariant) {
        existingVariant.size = variantDto.size;
        existingVariant.color = variantDto.color;
        existingVariant.stock = variantDto.stock;
        existingVariant.price = variantDto.price;
        await this.productVariantRepository.save(existingVariant);
        continue;
      }

      await this.productVariantRepository.save(
        this.productVariantRepository.create({
          product,
          sku: variantDto.sku,
          size: variantDto.size,
          color: variantDto.color,
          stock: variantDto.stock,
          price: variantDto.price,
        }),
      );
    }

    for (const variant of existing) {
      if (incomingSkus.has(variant.sku)) {
        continue;
      }

      const referenced = await this.orderItemRepository.exists({
        where: { variantId: variant.id },
      });
      if (referenced) {
        throw new BadRequestException(
          `Cannot delete variant "${variant.sku}" because it is already used in existing orders.`,
        );
      }

      await this.productVariantRepository.remove(variant);
    }

    product.basePrice = Math.min(...incoming.map((variant) => variant.price));
  }
}
