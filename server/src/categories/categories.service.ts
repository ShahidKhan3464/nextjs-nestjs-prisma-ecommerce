import { Injectable } from '@nestjs/common';
import { Category } from './entities/category.entity';
import { QueryCategoryDto } from './dto/query-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { GetCategoriesProvider } from './providers/get-categories.provider';
import { CreateCategoryProvider } from './providers/create-category.provider';
import { UpdateCategoryProvider } from './providers/update-category.provider';
import { DeleteCategoryProvider } from './providers/delete-category.provider';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly getCategoriesProvider: GetCategoriesProvider,
    private readonly createCategoryProvider: CreateCategoryProvider,
    private readonly updateCategoryProvider: UpdateCategoryProvider,
    private readonly deleteCategoryProvider: DeleteCategoryProvider,
  ) {}

  public async findAllPaginated(
    query: QueryCategoryDto,
  ): Promise<PaginateQueryResult<Category>> {
    return await this.getCategoriesProvider.findAllPaginated(query);
  }

  public async findOne(id: number): Promise<Category> {
    return await this.getCategoriesProvider.findOne(id);
  }

  public async create(dto: CreateCategoryDto): Promise<Category> {
    return await this.createCategoryProvider.create(dto);
  }

  public async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    return await this.updateCategoryProvider.update(id, dto);
  }

  public async delete(id: number): Promise<void> {
    return await this.deleteCategoryProvider.delete(id);
  }

  public async restore(id: number): Promise<Category> {
    return await this.deleteCategoryProvider.restore(id);
  }
}
