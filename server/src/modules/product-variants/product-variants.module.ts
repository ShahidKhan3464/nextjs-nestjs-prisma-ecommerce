import { Module } from '@nestjs/common';
import { ProductVariantsService } from './product-variants.service';
import { ProductVariantsController } from './product-variants.controller';
import { VariantOwnershipProvider } from './providers/variant-ownership.provider';
import { GetProductVariantsProvider } from './providers/get-product-variants.provider';
import { CreateProductVariantProvider } from './providers/create-product-variant.provider';
import { UpdateProductVariantProvider } from './providers/update-product-variant.provider';
import { DeleteProductVariantProvider } from './providers/delete-product-variant.provider';

@Module({
  providers: [
    ProductVariantsService,
    VariantOwnershipProvider,
    GetProductVariantsProvider,
    CreateProductVariantProvider,
    UpdateProductVariantProvider,
    DeleteProductVariantProvider,
  ],
  controllers: [ProductVariantsController],
})
export class ProductVariantsModule {}
