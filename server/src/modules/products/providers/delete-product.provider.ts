import { join } from 'path';
import { unlink } from 'fs/promises';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Injectable, NotFoundException } from '@nestjs/common';
import { getUploadsRoot } from 'src/integrations/storage/uploads-root';
import { ProductOwnershipProvider } from './product-ownership.provider';

@Injectable()
export class DeleteProductProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productOwnershipProvider: ProductOwnershipProvider,
  ) {}

  /** Soft-delete: only populates deletedAt. */
  public async remove(
    id: number,
    userId: number,
    roles: UserRole[],
  ): Promise<void> {
    await this.productOwnershipProvider.assertCanManage(id, userId, roles);

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

  public async safeUnlinkStorageKey(storageKey: string): Promise<void> {
    const abs = join(getUploadsRoot(), storageKey.replace(/^uploads\//, ''));
    try {
      await unlink(abs);
    } catch {
      /* file may already be gone */
    }
  }
}
