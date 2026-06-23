import { DataSource } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { SeedResult } from '../types/seed-result.type.js';
import { Product } from 'src/products/entities/product.entity';
import { FileOwnerModule } from 'src/common/files/file.constants';
import { Category } from 'src/categories/entities/category.entity';
import { SeedCategoriesProvider } from './seed-categories.provider.js';
import { ProductStatus } from 'src/products/constants/product.constants';
import { StoredFile } from 'src/common/files/entities/stored-file.entity';
import { ProductVariant } from 'src/products/entities/product-variant.entity';
import {
  DEMO_PRODUCTS,
  picsumImageUrl,
  DEMO_SEED_PRODUCT_SKU_MARKER,
} from '../data/demo-seed.data.js';

@Injectable()
export class SeedProductsProvider {
  private readonly logger = new Logger(SeedProductsProvider.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly seedCategoriesProvider: SeedCategoriesProvider,
  ) {}

  public async seed(): Promise<SeedResult> {
    const alreadySeeded = await this.dataSource
      .getRepository(ProductVariant)
      .exists({ where: { sku: DEMO_SEED_PRODUCT_SKU_MARKER } });

    if (alreadySeeded) {
      this.logger.log(
        `Products seeding skipped — marker SKU "${DEMO_SEED_PRODUCT_SKU_MARKER}" already exists.`,
      );
      return {
        created: 0,
        skipped: true,
        reason: 'products already seeded',
      };
    }

    const categoryMap =
      await this.seedCategoriesProvider.getCategoryMapByName();
    const firstCategoryName = DEMO_PRODUCTS[0]?.categoryName;

    if (!firstCategoryName || !categoryMap.has(firstCategoryName)) {
      this.logger.warn(
        `Products seeding skipped — required category "${firstCategoryName ?? 'unknown'}" is missing.`,
      );
      return {
        created: 0,
        skipped: true,
        reason: 'categories missing',
      };
    }

    const createdCount = await this.dataSource.transaction(async (manager) => {
      let count = 0;

      for (const productSeed of DEMO_PRODUCTS) {
        const category = categoryMap.get(productSeed.categoryName);

        if (!category) {
          throw new Error(
            `Demo category not found for product "${productSeed.name}": ${productSeed.categoryName}`,
          );
        }

        const product = manager.create(Product, {
          category: { id: category.id } as Category,
          name: productSeed.name,
          status: ProductStatus.ACTIVE,
          description: productSeed.description,
          basePrice: Math.min(
            ...productSeed.variants.map((variant) => variant.price),
          ),
        });

        await manager.save(product);

        const variantEntities = productSeed.variants.map((variant) =>
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

        const imageEntity = manager.create(StoredFile, {
          urlPath: picsumImageUrl(productSeed.imageSeed),
          sortOrder: 0,
          ownerModule: FileOwnerModule.PRODUCT,
          ownerId: product.id,
        });

        await manager.save(imageEntity);
        count += 1;
      }

      return count;
    });

    this.logger.log(
      `Seeded ${createdCount} products with variants and external image URLs.`,
    );

    return {
      created: createdCount,
      skipped: false,
    };
  }
}
