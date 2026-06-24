import { join } from 'path';
import { unlink } from 'fs/promises';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductStatus } from '../constants/product.constants';
import { ProductWithRelations } from 'src/common/types/domain.types';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class DeleteProductProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async remove(id: number): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  public async restore(id: number): Promise<ProductWithRelations> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (!product.deletedAt) {
      throw new BadRequestException('Product is not removed');
    }
    const restored = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: null },
      include: { category: true, variants: true },
    });
    return {
      ...restored,
      basePrice: Number(restored.basePrice),
      status: restored.status as ProductStatus,
      variants: restored.variants.map((variant) => ({
        ...variant,
        price: Number(variant.price),
      })),
    };
  }

  public async safeUnlinkPublicPath(urlPath: string): Promise<void> {
    const relative = urlPath.replace(/^\//, '');
    const abs = join(process.cwd(), relative);
    try {
      await unlink(abs);
    } catch {
      /* file may already be gone */
    }
  }
}
