import { Category } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class UpdateCategoryProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return await this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }
}
