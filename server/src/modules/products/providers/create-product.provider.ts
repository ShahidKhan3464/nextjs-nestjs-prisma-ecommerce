import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateProductDto } from '../dto/create-product.dto';
import { mapProductToResponse } from '../utils/map-product.util';
import { ProductWithRelations } from 'src/common/types/domain.types';
import { ProductOwnershipProvider } from './product-ownership.provider';
import { generateProductSlug } from '../utils/generate-product-slug.util';
import { resolveUniqueProductSlug } from '../utils/resolve-unique-product-slug.util';
import { buildProductStoredFileData } from '../utils/build-product-stored-file.util';
import {
  ProductStatus,
  ProductFileType,
  PRODUCT_INCLUDE,
} from '../constants/product.constants';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class CreateProductProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productOwnershipProvider: ProductOwnershipProvider,
  ) {}

  public async create(
    dto: CreateProductDto,
    files: Express.Multer.File[],
    userId: number,
    roles: UserRole[],
  ): Promise<ProductWithRelations> {
    const store = await this.productOwnershipProvider.resolveStoreForCreate(
      userId,
      roles,
    );

    const status = dto.status ?? ProductStatus.DRAFT;
    if (status === ProductStatus.ARCHIVED) {
      throw new BadRequestException(
        'Cannot create a product directly in ARCHIVED status',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      const category = await tx.category.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const skus = dto.variants.map((variant) => variant.sku);
      const skuConflicts = await tx.productVariant.findMany({
        where: { sku: { in: skus } },
        select: { sku: true },
      });
      if (skuConflicts.length > 0) {
        throw new ConflictException(
          `SKU "${skuConflicts[0].sku}" is already in use`,
        );
      }

      const baseSlug = generateProductSlug(dto.name);
      const slug = await resolveUniqueProductSlug(tx, baseSlug);

      const product = await tx.product.create({
        data: {
          slug,
          status,
          name: dto.name,
          storeId: store.id,
          categoryId: dto.categoryId,
          description: dto.description?.trim() || null,
          basePrice: Math.min(...dto.variants.map((v) => v.price)),
          publishedAt: status === ProductStatus.ACTIVE ? new Date() : null,
        },
      });

      await tx.productVariant.createMany({
        data: dto.variants.map((variant) => ({
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          price: variant.price,
          productId: product.id,
          stockQuantity: variant.stockQuantity,
        })),
      });

      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const storedFile = await tx.storedFile.create({
          data: buildProductStoredFileData(file),
        });

        await tx.productFile.create({
          data: {
            sortOrder: index,
            productId: product.id,
            fileId: storedFile.id,
            type:
              index === 0 ? ProductFileType.THUMBNAIL : ProductFileType.GALLERY,
          },
        });
      }

      const createdProduct = await tx.product.findUnique({
        where: { id: product.id },
        include: PRODUCT_INCLUDE,
      });

      if (!createdProduct) {
        throw new NotFoundException('Product not found');
      }

      return mapProductToResponse(createdProduct);
    });
  }
}
