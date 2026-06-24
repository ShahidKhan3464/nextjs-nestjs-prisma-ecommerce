import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProductDto } from '../dto/update-product.dto';
import { GetProductsProvider } from './get-products.provider';
import { FileOwnerModule } from 'src/common/files/file.constants';
import { DeleteProductProvider } from './delete-product.provider';
import { ProductWithRelations } from 'src/common/types/domain.types';
import { generateProductSlug } from '../utils/generate-product-slug.util';
import { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class UpdateProductProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly getProductsProvider: GetProductsProvider,
    private readonly deleteProductProvider: DeleteProductProvider,
  ) {}

  public async update(
    id: number,
    dto: UpdateProductDto,
    files: Express.Multer.File[] = [],
  ): Promise<ProductWithRelations> {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.categoryId !== undefined) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    if (dto.variants !== undefined) {
      await this.syncVariants(id, dto.variants);
    }

    const nextName = dto.name ?? product.name;
    await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        slug: generateProductSlug(nextName),
        ...(dto.variants !== undefined
          ? {
              basePrice: Math.min(
                ...dto.variants.map((variant) => variant.price),
              ),
            }
          : {}),
      },
    });

    if (dto.retainImagePaths !== undefined) {
      const keep = dto.retainImagePaths;
      const imagesToRemove = await this.prisma.storedFile.findMany({
        where: {
          ownerModule: FileOwnerModule.PRODUCT,
          ownerId: id,
          ...(keep.length > 0 ? { urlPath: { notIn: keep } } : {}),
        },
      });
      await Promise.all(
        imagesToRemove.map((img) =>
          this.deleteProductProvider.safeUnlinkPublicPath(img.urlPath),
        ),
      );
      await this.prisma.storedFile.deleteMany({
        where: {
          ownerModule: FileOwnerModule.PRODUCT,
          ownerId: id,
          ...(keep.length > 0 ? { urlPath: { notIn: keep } } : {}),
        },
      });
    }

    if (files.length > 0) {
      const existing = await this.prisma.storedFile.findMany({
        where: { ownerModule: FileOwnerModule.PRODUCT, ownerId: id },
        orderBy: { sortOrder: 'asc' },
      });
      const nextOrder =
        existing.length > 0
          ? Math.max(...existing.map((img) => img.sortOrder)) + 1
          : 0;

      await this.prisma.storedFile.createMany({
        data: files.map((file, index) => ({
          urlPath: `/uploads/products/${file.filename}`,
          sortOrder: nextOrder + index,
          ownerModule: FileOwnerModule.PRODUCT,
          ownerId: id,
        })),
      });
    }

    return await this.getProductsProvider.findOne(id);
  }

  private async syncVariants(
    productId: number,
    incoming: CreateProductVariantDto[],
  ): Promise<void> {
    const existing = await this.prisma.productVariant.findMany({
      where: { productId },
    });
    const existingBySku = new Map(
      existing.map((variant) => [variant.sku, variant]),
    );
    const incomingSkus = new Set(incoming.map((variant) => variant.sku));

    for (const variant of incoming) {
      if (existingBySku.has(variant.sku)) {
        continue;
      }

      const skuExists = await this.prisma.productVariant.findUnique({
        where: { sku: variant.sku },
      });
      if (skuExists) {
        throw new ConflictException(`SKU "${variant.sku}" is already in use`);
      }
    }

    for (const variantDto of incoming) {
      const existingVariant = existingBySku.get(variantDto.sku);
      if (existingVariant) {
        await this.prisma.productVariant.update({
          where: { id: existingVariant.id },
          data: {
            size: variantDto.size,
            color: variantDto.color,
            stock: variantDto.stock,
            price: variantDto.price,
          },
        });
        continue;
      }

      await this.prisma.productVariant.create({
        data: {
          productId,
          sku: variantDto.sku,
          size: variantDto.size,
          color: variantDto.color,
          stock: variantDto.stock,
          price: variantDto.price,
        },
      });
    }

    for (const variant of existing) {
      if (incomingSkus.has(variant.sku)) {
        continue;
      }

      const referenced = await this.prisma.orderItem.findFirst({
        where: { variantId: variant.id },
      });
      if (referenced) {
        throw new BadRequestException(
          `Cannot delete variant "${variant.sku}" because it is already used in existing orders.`,
        );
      }

      await this.prisma.productVariant.delete({ where: { id: variant.id } });
    }
  }
}
