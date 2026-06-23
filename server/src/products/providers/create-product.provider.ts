import { DataSource } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductStatus } from '../constants/product.constants';
import { FileOwnerModule } from 'src/common/files/file.constants';
import { Category } from 'src/categories/entities/category.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { StoredFile } from 'src/common/files/entities/stored-file.entity';
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class CreateProductProvider {
  constructor(private readonly dataSource: DataSource) {}

  public async create(
    dto: CreateProductDto,
    files: Express.Multer.File[],
  ): Promise<Product> {
    return await this.dataSource.transaction(async (manager) => {
      const category = await manager.findOne(Category, {
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      for (const variant of dto.variants) {
        const skuExists = await manager.exists(ProductVariant, {
          where: { sku: variant.sku },
        });

        if (skuExists) {
          throw new ConflictException(`SKU "${variant.sku}" is already in use`);
        }
      }

      const product = manager.create(Product, {
        category,
        name: dto.name,
        status: dto.status ?? ProductStatus.ACTIVE,
        description: dto.description?.trim() || null,
        basePrice: Math.min(...dto.variants.map((v) => v.price)),
      });

      await manager.save(product);

      const variantEntities = dto.variants.map((variant) =>
        manager.create(ProductVariant, {
          product,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
          price: variant.price,
        }),
      );

      await manager.save(variantEntities);

      const imageEntities = files.map((file, index) =>
        manager.create(StoredFile, {
          urlPath: `/uploads/products/${file.filename}`,
          sortOrder: index,
          ownerModule: FileOwnerModule.PRODUCT,
          ownerId: product.id,
        }),
      );

      await manager.save(imageEntities);

      const createdProduct = await manager.findOne(Product, {
        where: { id: product.id },
        relations: {
          category: true,
          variants: true,
        },
      });

      if (!createdProduct) {
        throw new NotFoundException('Product not found');
      }

      createdProduct.images = imageEntities;
      return createdProduct;
    });
  }
}
