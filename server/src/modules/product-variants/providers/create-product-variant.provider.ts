import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { VariantOwnershipProvider } from './variant-ownership.provider';
import { VARIANT_INCLUDE } from '../constants/product-variant.constants';
import { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import { ProductVariantWithRelations } from 'src/common/types/domain.types';
import { mapProductVariantToResponse } from '../utils/map-product-variant.util';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class CreateProductVariantProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly variantOwnershipProvider: VariantOwnershipProvider,
  ) {}

  public async create(
    dto: CreateProductVariantDto,
    userId: number,
    roles: UserRole[],
  ): Promise<ProductVariantWithRelations> {
    await this.variantOwnershipProvider.assertCanManageProduct(
      dto.productId,
      userId,
      roles,
    );

    if (dto.stockQuantity < 0) {
      throw new BadRequestException(
        'stockQuantity must be greater than or equal to 0',
      );
    }

    if (dto.price < 0) {
      throw new BadRequestException('price must be greater than or equal to 0');
    }

    return await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: dto.productId, deletedAt: null },
        select: { id: true },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const skuExists = await tx.productVariant.findUnique({
        where: { sku: dto.sku },
      });

      if (skuExists) {
        throw new ConflictException(`SKU "${dto.sku}" is already in use`);
      }

      const duplicateCombo = await tx.productVariant.findFirst({
        where: {
          productId: dto.productId,
          color: dto.color,
          size: dto.size,
        },
      });

      if (duplicateCombo) {
        throw new ConflictException(
          `A variant with color "${dto.color}" and size "${dto.size}" already exists for this product`,
        );
      }

      const created = await tx.productVariant.create({
        data: {
          sku: dto.sku,
          size: dto.size,
          color: dto.color,
          price: dto.price,
          productId: dto.productId,
          stockQuantity: dto.stockQuantity,
        },
        include: VARIANT_INCLUDE,
      });

      return mapProductVariantToResponse(created);
    });
  }
}
