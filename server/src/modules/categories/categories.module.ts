import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { GetCategoriesProvider } from './providers/get-categories.provider';
import { CreateCategoryProvider } from './providers/create-category.provider';
import { UpdateCategoryProvider } from './providers/update-category.provider';
import { DeleteCategoryProvider } from './providers/delete-category.provider';

@Module({
  providers: [
    CategoriesService,
    GetCategoriesProvider,
    CreateCategoryProvider,
    UpdateCategoryProvider,
    DeleteCategoryProvider,
  ],
  controllers: [CategoriesController],
})
export class CategoriesModule {}
