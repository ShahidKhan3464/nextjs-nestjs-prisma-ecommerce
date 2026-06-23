import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class UpdateCategoryProvider {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  public async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    Object.assign(category, dto);
    return await this.categoryRepository.save(category);
  }
}
