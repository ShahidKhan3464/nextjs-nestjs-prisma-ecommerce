import { Injectable, Logger } from '@nestjs/common';
import { Category } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SeedResult } from '../types/seed-result.type.js';
import {
  DEMO_CATEGORIES,
  DEMO_SEED_CATEGORY_MARKER,
} from '../data/demo-seed.data.js';

@Injectable()
export class SeedCategoriesProvider {
  private readonly logger = new Logger(SeedCategoriesProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  public async seed(): Promise<SeedResult> {
    const alreadySeeded = await this.prisma.category.findFirst({
      where: { name: DEMO_SEED_CATEGORY_MARKER },
    });

    if (alreadySeeded) {
      this.logger.log(
        `Categories seeding skipped — marker category "${DEMO_SEED_CATEGORY_MARKER}" already exists.`,
      );
      return {
        created: 0,
        skipped: true,
        reason: 'categories already seeded',
      };
    }

    const saved = await this.prisma.$transaction(
      DEMO_CATEGORIES.map((category) =>
        this.prisma.category.create({
          data: {
            name: category.name,
            description: category.description,
          },
        }),
      ),
    );

    this.logger.log(`Seeded ${saved.length} categories.`);

    return {
      created: saved.length,
      skipped: false,
    };
  }

  public async getCategoryMapByName(): Promise<Map<string, Category>> {
    const categories = await this.prisma.category.findMany({
      where: {
        name: { in: DEMO_CATEGORIES.map((category) => category.name) },
      },
    });

    return new Map(categories.map((category) => [category.name, category]));
  }
}
