import { Category } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class DeleteCategoryProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async delete(id: number): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const hasProducts = await this.prisma.product.count({
      where: {
        categoryId: id,
        deletedAt: null,
      },
    });

    if (hasProducts) {
      throw new BadRequestException(
        'Cannot delete category because it contains products',
      );
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  public async restore(id: number): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.deletedAt) {
      throw new BadRequestException('Category is not removed');
    }

    return await this.prisma.category.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
