import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class CreateCategoryProvider {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  public async create(dto: CreateCategoryDto): Promise<Category> {
    const entity = this.categoryRepository.create(dto);
    return await this.categoryRepository.save(entity);
  }
}
