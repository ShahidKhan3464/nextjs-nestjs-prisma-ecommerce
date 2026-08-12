import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SeedResult } from '../types/seed-result.type.js';
import { SeedCategoriesProvider } from './seed-categories.provider.js';
import { ProductFileType } from 'src/modules/files/constants/file.constants';
import { ProductStatus } from 'src/modules/products/constants/product.constants';
import { generateProductSlug } from 'src/modules/products/utils/generate-product-slug.util';
import {
  DEMO_SELLERS,
  demoStoreTag,
  DEMO_PRODUCTS,
  picsumImageUrl,
  DEMO_PRODUCTS_PER_STORE,
  DEMO_SEED_PRODUCT_SKU_MARKER,
  DEMO_DRAFT_PRODUCTS_PER_STORE,
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

    const storeSlugs = DEMO_SELLERS.map((seller) => seller.store.slug);
    const stores = await this.prisma.store.findMany({
      where: { slug: { in: storeSlugs }, deletedAt: null },
      select: { id: true, slug: true },
      orderBy: { slug: 'asc' },
    });

    if (stores.length !== DEMO_SELLERS.length) {
      this.logger.warn(
        `Products seeding skipped — expected ${DEMO_SELLERS.length} demo stores, found ${stores.length}.`,
      );
      return {
        created: 0,
        skipped: true,
        reason: 'demo stores missing',
      };
    }

    if (DEMO_PRODUCTS.length < DEMO_PRODUCTS_PER_STORE) {
      this.logger.warn(
        `Products seeding skipped — need at least ${DEMO_PRODUCTS_PER_STORE} catalog templates, found ${DEMO_PRODUCTS.length}.`,
      );
      return {
        created: 0,
        skipped: true,
        reason: 'product catalog too small',
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

    const storeIdBySlug = new Map(
      stores.map((store) => [store.slug, store.id]),
    );

    const createdCount = await this.prisma.$transaction(async (tx) => {
      let count = 0;

      for (let storeIndex = 0; storeIndex < DEMO_SELLERS.length; storeIndex++) {
        const seller = DEMO_SELLERS[storeIndex];
        const storeId = storeIdBySlug.get(seller.store.slug);

        if (!storeId) {
          throw new Error(
            `Demo store not found for slug "${seller.store.slug}"`,
          );
        }

        const storeTag = demoStoreTag(storeIndex);
        const catalogSlice = DEMO_PRODUCTS.slice(0, DEMO_PRODUCTS_PER_STORE);

        for (
          let productIndex = 0;
          productIndex < catalogSlice.length;
          productIndex++
        ) {
          const productSeed = catalogSlice[productIndex];
          const category = categoryMap.get(productSeed.categoryName);

          if (!category) {
            throw new Error(
              `Demo category not found for product "${productSeed.name}": ${productSeed.categoryName}`,
            );
          }

          const isDraft = productIndex < DEMO_DRAFT_PRODUCTS_PER_STORE;
          const status = isDraft ? ProductStatus.DRAFT : ProductStatus.ACTIVE;
          const baseSlug = generateProductSlug(productSeed.name);
          const slug = `${baseSlug}-${storeTag.toLowerCase()}`;

          const product = await tx.product.create({
            data: {
              storeId,
              slug,
              name: productSeed.name,
              categoryId: category.id,
              status,
              description: productSeed.description,
              publishedAt: isDraft ? null : new Date(),
              basePrice: Math.min(
                ...productSeed.variants.map((variant) => variant.price),
              ),
            },
          });

          await tx.productVariant.createMany({
            data: productSeed.variants.map((variant) => ({
              productId: product.id,
              sku: `${storeTag}-${variant.sku}`,
              size: variant.size,
              color: variant.color,
              price: variant.price,
              stockQuantity: variant.stock,
            })),
          });

          const imageSeed = `${storeTag.toLowerCase()}-${productSeed.imageSeed}`;
          const storedFile = await tx.storedFile.create({
            data: {
              fileSize: 0,
              extension: 'jpg',
              mimeType: 'image/jpeg',
              storedName: `${imageSeed}.jpg`,
              originalName: `${imageSeed}.jpg`,
              urlPath: picsumImageUrl(imageSeed),
              storageKey: `external/demo/${product.id}/${imageSeed}.jpg`,
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
      }

      return count;
    });

    this.logger.log(
      `Seeded ${createdCount} products (${DEMO_DRAFT_PRODUCTS_PER_STORE} DRAFT + ${DEMO_PRODUCTS_PER_STORE - DEMO_DRAFT_PRODUCTS_PER_STORE} ACTIVE per store).`,
    );

    return {
      created: createdCount,
      skipped: false,
    };
  }
}
