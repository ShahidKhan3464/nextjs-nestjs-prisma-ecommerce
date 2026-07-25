import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { VariantOwnershipProvider } from './variant-ownership.provider';
import { VARIANT_INCLUDE } from '../constants/product-variant.constants';
import { UpdateProductVariantDto } from '../dto/update-product-variant.dto';
import { ProductVariantWithRelations } from 'src/common/types/domain.types';
import { mapProductVariantToResponse } from '../utils/map-product-variant.util';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class UpdateProductVariantProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly variantOwnershipProvider: VariantOwnershipProvider,
  ) {}

  public async update(
    id: number,
    dto: UpdateProductVariantDto,
    userId: number,
    roles: UserRole[],
  ): Promise<ProductVariantWithRelations> {
    const existing = await this.variantOwnershipProvider.assertCanManageVariant(
      id,
      userId,
      roles,
    );

    if (
      dto.sku === undefined &&
      dto.size === undefined &&
      dto.color === undefined &&
      dto.stockQuantity === undefined &&
      dto.price === undefined
    ) {
      throw new BadRequestException('No fields provided to update');
    }

    if (dto.stockQuantity !== undefined && dto.stockQuantity < 0) {
      throw new BadRequestException(
        'stockQuantity must be greater than or equal to 0',
      );
    }

    if (dto.price !== undefined && dto.price < 0) {
      throw new BadRequestException('price must be greater than or equal to 0');
    }

    const nextSize = dto.size ?? existing.size;
    const nextColor = dto.color ?? existing.color;
    const nextSku = dto.sku ?? existing.sku;
    const colorOrSizeChanging =
      (dto.size !== undefined && dto.size !== existing.size) ||
      (dto.color !== undefined && dto.color !== existing.color);
    const skuChanging = dto.sku !== undefined && dto.sku !== existing.sku;

    return await this.prisma.$transaction(async (tx) => {
      if (skuChanging) {
        const skuExists = await tx.productVariant.findUnique({
          where: { sku: nextSku },
        });

        if (skuExists && skuExists.id !== id) {
          throw new ConflictException(`SKU "${nextSku}" is already in use`);
        }
      }

      if (colorOrSizeChanging) {
        const duplicateCombo = await tx.productVariant.findFirst({
          where: {
            productId: existing.productId,
            color: nextColor,
            size: nextSize,
            NOT: { id },
          },
        });

        if (duplicateCombo) {
          throw new ConflictException(
            `A variant with color "${nextColor}" and size "${nextSize}" already exists for this product`,
          );
        }
      }

      const updated = await tx.productVariant.update({
        where: { id },
        data: {
          ...(dto.size !== undefined ? { size: dto.size } : {}),
          ...(dto.color !== undefined ? { color: dto.color } : {}),
          ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
          ...(dto.price !== undefined ? { price: dto.price } : {}),
          ...(dto.stockQuantity !== undefined
            ? { stockQuantity: dto.stockQuantity }
            : {}),
        },
        include: VARIANT_INCLUDE,
      });

      if (!updated) {
        throw new NotFoundException('Product variant not found');
      }

      return mapProductVariantToResponse(updated);
    });
  }
}
