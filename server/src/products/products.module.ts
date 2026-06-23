import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Module, forwardRef } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { FilesModule } from 'src/common/files/files.module';
import { OrderItem } from 'src/orders/entities/order-item.entity';
import { Category } from 'src/categories/entities/category.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { GetProductsProvider } from './providers/get-products.provider';
import { CreateProductProvider } from './providers/create-product.provider';
import { UpdateProductProvider } from './providers/update-product.provider';
import { DeleteProductProvider } from './providers/delete-product.provider';
import { ProductImagesProvider } from './providers/product-images.provider';

@Module({
  imports: [
    FilesModule,
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([Category, Product, ProductVariant, OrderItem]),
  ],
  providers: [
    ProductsService,
    GetProductsProvider,
    CreateProductProvider,
    UpdateProductProvider,
    DeleteProductProvider,
    ProductImagesProvider,
  ],
  controllers: [ProductsController],
})
export class ProductsModule {}
