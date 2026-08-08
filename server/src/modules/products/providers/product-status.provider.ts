import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { mapProductToResponse } from '../utils/map-product.util';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ProductWithRelations } from 'src/common/types/domain.types';
import { ProductOwnershipProvider } from './product-ownership.provider';
import { ProductStatus, PRODUCT_INCLUDE } from '../constants/product.constants';
import { assertProductStatusTransition } from '../utils/assert-product-status-transition.util';

@Injectable()
export class ProductStatusProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productOwnershipProvider: ProductOwnershipProvider,
  ) {}

  /** DRAFT → ACTIVE. Sets publishedAt on first publish. */
  public async publish(
    productId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<ProductWithRelations> {
    return this.transition(
      productId,
      userId,
      roles,
      ProductStatus.ACTIVE,
      (product) => ({
        status: ProductStatus.ACTIVE,
        publishedAt: product.publishedAt ?? new Date(),
      }),
    );
  }

  /** ACTIVE → ARCHIVED. */
  public async archive(
    productId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<ProductWithRelations> {
    return this.transition(
      productId,
      userId,
      roles,
      ProductStatus.ARCHIVED,
      () => ({ status: ProductStatus.ARCHIVED }),
    );
  }

  /**
   * Restore semantics:
   * - Soft-deleted → clear deletedAt
   * - ARCHIVED (not deleted) → ACTIVE
   */
  public async restore(
    productId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<ProductWithRelations> {
    const product = await this.productOwnershipProvider.assertCanManage(
      productId,
      userId,
      roles,
      { includeDeleted: true, allowSuspendedStore: true },
    );

    if (product.deletedAt) {
      this.productOwnershipProvider.assertStoreAllowsProductWrite(product.store);

      const restored = await this.prisma.product.update({
        where: { id: productId },
        data: { deletedAt: null },
        include: PRODUCT_INCLUDE,
      });

      return mapProductToResponse(restored);
    }

    if (product.status !== ProductStatus.ARCHIVED) {
      throw new BadRequestException(
        'Product is not archived or soft-deleted and cannot be restored',
      );
    }

    this.productOwnershipProvider.assertStoreAllowsProductWrite(product.store);

    assertProductStatusTransition(
      product.status as ProductStatus,
      ProductStatus.ACTIVE,
    );

    const restored = await this.prisma.product.update({
      where: { id: productId },
      data: { status: ProductStatus.ACTIVE },
      include: PRODUCT_INCLUDE,
    });

    return mapProductToResponse(restored);
  }

  private async transition(
    productId: number,
    userId: number,
    roles: UserRole[],
    nextStatus: ProductStatus,
    buildData: (product: { status: string; publishedAt: Date | null }) => {
      status: ProductStatus;
      publishedAt?: Date;
    },
  ): Promise<ProductWithRelations> {
    const product = await this.productOwnershipProvider.assertCanManage(
      productId,
      userId,
      roles,
    );

    assertProductStatusTransition(product.status as ProductStatus, nextStatus);

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: buildData(product),
      include: PRODUCT_INCLUDE,
    });

    return mapProductToResponse(updated);
  }
}
