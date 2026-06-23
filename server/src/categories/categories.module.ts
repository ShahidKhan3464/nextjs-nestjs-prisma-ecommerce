import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Module, forwardRef } from '@nestjs/common';
import { Category } from './entities/category.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Product } from 'src/products/entities/product.entity';
import { GetCategoriesProvider } from './providers/get-categories.provider';
import { CreateCategoryProvider } from './providers/create-category.provider';
import { UpdateCategoryProvider } from './providers/update-category.provider';
import { DeleteCategoryProvider } from './providers/delete-category.provider';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([Category, Product]),
  ],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    GetCategoriesProvider,
    CreateCategoryProvider,
    UpdateCategoryProvider,
    DeleteCategoryProvider,
  ],
})
export class CategoriesModule {}
