import { AuthModule } from 'src/auth/auth.module';
import { Module, forwardRef } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { GetProductsProvider } from './providers/get-products.provider';
import { CreateProductProvider } from './providers/create-product.provider';
import { UpdateProductProvider } from './providers/update-product.provider';
import { DeleteProductProvider } from './providers/delete-product.provider';
import { ProductImagesProvider } from './providers/product-images.provider';

@Module({
  imports: [forwardRef(() => AuthModule)],
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
