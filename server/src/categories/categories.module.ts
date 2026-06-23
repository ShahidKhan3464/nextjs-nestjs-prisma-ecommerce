import { AuthModule } from 'src/auth/auth.module';
import { Module, forwardRef } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { GetCategoriesProvider } from './providers/get-categories.provider';
import { CreateCategoryProvider } from './providers/create-category.provider';
import { UpdateCategoryProvider } from './providers/update-category.provider';
import { DeleteCategoryProvider } from './providers/delete-category.provider';

@Module({
  imports: [forwardRef(() => AuthModule)],
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
