import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { Product } from 'src/products/entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { SeedAdminProvider } from './providers/seed-admin.provider.js';
import { StoredFile } from 'src/common/files/entities/stored-file.entity';
import { SeedProductsProvider } from './providers/seed-products.provider.js';
import { ProductVariant } from 'src/products/entities/product-variant.entity';
import { SeedCustomersProvider } from './providers/seed-customers.provider.js';
import { SeedCategoriesProvider } from './providers/seed-categories.provider.js';
import { SeedDemoOrchestratorProvider } from './providers/seed-demo-orchestrator.provider.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      User,
      Product,
      Category,
      StoredFile,
      ProductVariant,
    ]),
  ],
  providers: [
    SeedAdminProvider,
    SeedProductsProvider,
    SeedCustomersProvider,
    SeedCategoriesProvider,
    SeedDemoOrchestratorProvider,
  ],
})
export class SeedersModule {}
