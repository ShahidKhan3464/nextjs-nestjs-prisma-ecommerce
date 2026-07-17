import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SeedResult } from '../types/seed-result.type.js';
import { ProductFileType } from 'src/files/constants/file.constants';
import { SeedCategoriesProvider } from './seed-categories.provider.js';
import { ProductStatus } from 'src/products/constants/product.constants';
import { generateProductSlug } from 'src/products/utils/generate-product-slug.util';
import {
  DEMO_PRODUCTS,
  picsumImageUrl,
  DEMO_SEED_PRODUCT_SKU_MARKER,
} from '../data/demo-seed.data.js';

@Injectable()
export class SeedProductsProvider {
  private readonly logger = new Logger(SeedProductsProvider.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly seedCategoriesProvider: SeedCategoriesProvider,
  ) {}

  public async seed(): Promise<SeedResult> {
    const alreadySeeded = await this.prisma.productVariant.findUnique({
      where: { sku: DEMO_SEED_PRODUCT_SKU_MARKER },
    });

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

    const store = await this.prisma.store.findFirst({
      where: { deletedAt: null },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    if (!store) {
      this.logger.warn(
        'Products seeding skipped — no store exists to attach products to.',
      );
      return {
        created: 0,
        skipped: true,
        reason: 'no store available',
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

    const createdCount = await this.prisma.$transaction(async (tx) => {
      let count = 0;

      for (const productSeed of DEMO_PRODUCTS) {
        const category = categoryMap.get(productSeed.categoryName);

        if (!category) {
          throw new Error(
            `Demo category not found for product "${productSeed.name}": ${productSeed.categoryName}`,
          );
        }

        const product = await tx.product.create({
          data: {
            storeId: store.id,
            name: productSeed.name,
            categoryId: category.id,
            status: ProductStatus.ACTIVE,
            description: productSeed.description,
            slug: generateProductSlug(productSeed.name),
            basePrice: Math.min(
              ...productSeed.variants.map((variant) => variant.price),
            ),
          },
        });

        await tx.productVariant.createMany({
          data: productSeed.variants.map((variant) => ({
            productId: product.id,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            price: variant.price,
            stockQuantity: variant.stock,
          })),
        });

        const storedFile = await tx.storedFile.create({
          data: {
            fileSize: 0,
            extension: 'jpg',
            mimeType: 'image/jpeg',
            storedName: `${productSeed.imageSeed}.jpg`,
            originalName: `${productSeed.imageSeed}.jpg`,
            urlPath: picsumImageUrl(productSeed.imageSeed),
            storageKey: `external/demo/${product.id}/${productSeed.imageSeed}.jpg`,
          },
        });

        await tx.productFile.create({
          data: {
            sortOrder: 0,
            productId: product.id,
            fileId: storedFile.id,
            type: ProductFileType.THUMBNAIL,
          },
        });

        count += 1;
      }

      return count;
    });

    this.logger.log(
      `Seeded ${createdCount} products with variants and ProductFile associations.`,
    );

    return {
      created: createdCount,
      skipped: false,
    };
  }
}
