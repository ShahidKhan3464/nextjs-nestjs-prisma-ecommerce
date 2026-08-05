import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UpdateProductDto } from '../dto/update-product.dto';
import { mapProductToResponse } from '../utils/map-product.util';
import { DeleteProductProvider } from './delete-product.provider';
import { ProductWithRelations } from 'src/common/types/domain.types';
import { ProductOwnershipProvider } from './product-ownership.provider';
import { generateProductSlug } from '../utils/generate-product-slug.util';
import { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import { resolveUniqueProductSlug } from '../utils/resolve-unique-product-slug.util';
import { buildProductStoredFileData } from '../utils/build-product-stored-file.util';
import {
  PRODUCT_INCLUDE,
  ProductFileType,
} from '../constants/product.constants';
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
    private readonly deleteProductProvider: DeleteProductProvider,
    private readonly productOwnershipProvider: ProductOwnershipProvider,
  ) {}

  public async update(
    id: number,
    dto: UpdateProductDto,
    files: Express.Multer.File[] = [],
    userId: number,
    roles: UserRole[],
  ): Promise<ProductWithRelations> {
    await this.productOwnershipProvider.assertCanManage(id, userId, roles);

    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (
      dto.name === undefined &&
      dto.variants === undefined &&
      dto.categoryId === undefined &&
      dto.description === undefined &&
      dto.retainImagePaths === undefined &&
      files.length === 0
    ) {
      throw new BadRequestException('No fields provided to update');
    }

    if (dto.categoryId !== undefined) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const removedStorageKeys: string[] = [];

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.variants !== undefined) {
        await this.syncVariants(tx, id, dto.variants);
      }

      let slug: string | undefined;
      if (dto.name !== undefined && dto.name !== product.name) {
        const baseSlug = generateProductSlug(dto.name);
        slug = await resolveUniqueProductSlug(tx, baseSlug, id);
      }

      await tx.product.update({
        where: { id },
        data: {
          ...(dto.categoryId !== undefined
            ? { categoryId: dto.categoryId }
            : {}),
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(slug !== undefined ? { slug } : {}),
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
        const imagesToRemove = await tx.productFile.findMany({
          where: {
            productId: id,
            ...(keep.length > 0 ? { file: { urlPath: { notIn: keep } } } : {}),
          },
          include: { file: true },
        });

        for (const entry of imagesToRemove) {
          await tx.productFile.delete({ where: { id: entry.id } });
          await tx.storedFile.delete({ where: { id: entry.fileId } });
          removedStorageKeys.push(entry.file.storageKey);
        }
      }

      if (files.length > 0) {
        const existing = await tx.productFile.findMany({
          where: { productId: id },
          orderBy: { sortOrder: 'asc' },
        });
        const nextOrder =
          existing.length > 0
            ? Math.max(...existing.map((img) => img.sortOrder)) + 1
            : 0;

        for (let index = 0; index < files.length; index++) {
          const file = files[index];
          const storedFile = await tx.storedFile.create({
            data: buildProductStoredFileData(file),
          });

          await tx.productFile.create({
            data: {
              productId: id,
              fileId: storedFile.id,
              sortOrder: nextOrder + index,
              type:
                existing.length === 0 && index === 0
                  ? ProductFileType.THUMBNAIL
                  : ProductFileType.GALLERY,
            },
          });
        }
      }

      const result = await tx.product.findFirst({
        where: { id, deletedAt: null },
        include: PRODUCT_INCLUDE,
      });

      if (!result) {
        throw new NotFoundException('Product not found');
      }

      return result;
    });

    await Promise.all(
      removedStorageKeys.map((key) =>
        this.deleteProductProvider.safeUnlinkStorageKey(key),
      ),
    );

    return mapProductToResponse(updated);
  }

  private async syncVariants(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    productId: number,
    incoming: CreateProductVariantDto[],
  ): Promise<void> {
    const existing = await tx.productVariant.findMany({
      where: { productId },
    });
    const existingBySku = new Map(
      existing.map((variant) => [variant.sku, variant]),
    );
    const incomingSkus = new Set(incoming.map((variant) => variant.sku));

    const newSkus = incoming
      .map((variant) => variant.sku)
      .filter((sku) => !existingBySku.has(sku));
    if (newSkus.length > 0) {
      const skuConflicts = await tx.productVariant.findMany({
        where: { sku: { in: newSkus } },
        select: { sku: true },
      });
      if (skuConflicts.length > 0) {
        throw new ConflictException(
          `SKU "${skuConflicts[0].sku}" is already in use`,
        );
      }
    }

    for (const variantDto of incoming) {
      const existingVariant = existingBySku.get(variantDto.sku);
      if (existingVariant) {
        await tx.productVariant.update({
          where: { id: existingVariant.id },
          data: {
            size: variantDto.size,
            color: variantDto.color,
            price: variantDto.price,
            stockQuantity: variantDto.stockQuantity,
          },
        });
        continue;
      }

      await tx.productVariant.create({
        data: {
          productId,
          sku: variantDto.sku,
          size: variantDto.size,
          color: variantDto.color,
          price: variantDto.price,
          stockQuantity: variantDto.stockQuantity,
        },
      });
    }

    const toRemove = existing.filter(
      (variant) => !incomingSkus.has(variant.sku),
    );
    if (toRemove.length > 0) {
      const referenced = await tx.orderItem.findMany({
        where: { variantId: { in: toRemove.map((variant) => variant.id) } },
        select: { variantId: true },
      });
      const referencedIds = new Set(referenced.map((row) => row.variantId));

      for (const variant of toRemove) {
        if (referencedIds.has(variant.id)) {
          throw new BadRequestException(
            `Cannot delete variant "${variant.sku}" because it is already used in existing orders.`,
          );
        }
        await tx.productVariant.delete({ where: { id: variant.id } });
      }
    }
  }
}
