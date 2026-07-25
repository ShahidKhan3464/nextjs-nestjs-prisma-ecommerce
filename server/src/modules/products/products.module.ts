import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { GetProductsProvider } from './providers/get-products.provider';
import { CreateProductProvider } from './providers/create-product.provider';
import { UpdateProductProvider } from './providers/update-product.provider';
import { DeleteProductProvider } from './providers/delete-product.provider';
import { ProductImagesProvider } from './providers/product-images.provider';
import { ProductStatusProvider } from './providers/product-status.provider';
import { ProductOwnershipProvider } from './providers/product-ownership.provider';

@Module({
  providers: [
    ProductsService,
    GetProductsProvider,
    CreateProductProvider,
    UpdateProductProvider,
    DeleteProductProvider,
    ProductImagesProvider,
    ProductStatusProvider,
    ProductOwnershipProvider,
  ],
  controllers: [ProductsController],
})
export class ProductsModule {}
