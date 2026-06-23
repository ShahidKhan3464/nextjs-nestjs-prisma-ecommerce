import { IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { Product } from 'src/products/entities/product.entity';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class DeleteCategoryProvider {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  public async delete(id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const hasProducts = await this.productRepository.exists({
      where: {
        category: { id },
        deletedAt: IsNull(),
      },
    });

    if (hasProducts) {
      throw new BadRequestException(
        'Cannot delete category because it contains products',
      );
    }

    await this.categoryRepository.softDelete(id);
  }

  public async restore(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.deletedAt) {
      throw new BadRequestException('Category is not removed');
    }

    await this.categoryRepository.recover(category);
    return category;
  }
}
