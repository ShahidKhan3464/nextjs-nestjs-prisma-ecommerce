import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { SeedResult } from '../types/seed-result.type.js';
import { Category } from 'src/categories/entities/category.entity';
import {
  DEMO_CATEGORIES,
  DEMO_SEED_CATEGORY_MARKER,
} from '../data/demo-seed.data.js';

@Injectable()
export class SeedCategoriesProvider {
  private readonly logger = new Logger(SeedCategoriesProvider.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  public async seed(): Promise<SeedResult> {
    const alreadySeeded = await this.categoryRepository.exists({
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

    const entities = DEMO_CATEGORIES.map((category) =>
      this.categoryRepository.create({
        name: category.name,
        description: category.description,
      }),
    );

    const saved = await this.categoryRepository.save(entities);

    this.logger.log(`Seeded ${saved.length} categories.`);

    return {
      created: saved.length,
      skipped: false,
    };
  }

  public async getCategoryMapByName(): Promise<Map<string, Category>> {
    const categories = await this.categoryRepository.find({
      where: {
        name: In(DEMO_CATEGORIES.map((category) => category.name)),
      },
    });

    return new Map(categories.map((category) => [category.name, category]));
  }
}
