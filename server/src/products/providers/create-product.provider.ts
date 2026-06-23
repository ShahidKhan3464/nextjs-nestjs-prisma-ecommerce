import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductStatus } from '../constants/product.constants';
import { FileOwnerModule } from 'src/common/files/file.constants';
import { ProductWithRelations } from 'src/common/types/domain.types';
import { generateProductSlug } from '../utils/generate-product-slug.util';
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class CreateProductProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async create(
    dto: CreateProductDto,
    files: Express.Multer.File[],
  ): Promise<ProductWithRelations> {
    return await this.prisma.$transaction(async (tx) => {
      const category = await tx.category.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      for (const variant of dto.variants) {
        const skuExists = await tx.productVariant.findUnique({
          where: { sku: variant.sku },
        });

        if (skuExists) {
          throw new ConflictException(`SKU "${variant.sku}" is already in use`);
        }
      }

      const product = await tx.product.create({
        data: {
          name: dto.name,
          categoryId: dto.categoryId,
          slug: generateProductSlug(dto.name),
          status: dto.status ?? ProductStatus.ACTIVE,
          description: dto.description?.trim() || null,
          basePrice: Math.min(...dto.variants.map((v) => v.price)),
        },
      });

      await tx.productVariant.createMany({
        data: dto.variants.map((variant) => ({
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
          price: variant.price,
          productId: product.id,
        })),
      });

      const imageEntities = await Promise.all(
        files.map((file, index) =>
          tx.storedFile.create({
            data: {
              urlPath: `/uploads/products/${file.filename}`,
              sortOrder: index,
              ownerModule: FileOwnerModule.PRODUCT,
              ownerId: product.id,
            },
          }),
        ),
      );

      const createdProduct = await tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          variants: true,
        },
      });

      if (!createdProduct) {
        throw new NotFoundException('Product not found');
      }

      return {
        ...createdProduct,
        basePrice: Number(createdProduct.basePrice),
        status: createdProduct.status as ProductStatus,
        variants: createdProduct.variants.map((variant) => ({
          ...variant,
          price: Number(variant.price),
        })),
        images: imageEntities,
      };
    });
  }
}
