import { ConfigService } from '@nestjs/config';
import { SeedResult } from '../types/seed-result.type.js';
import { SeedProductsProvider } from './seed-products.provider.js';
import { SeedCustomersProvider } from './seed-customers.provider.js';
import { SeedCategoriesProvider } from './seed-categories.provider.js';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class SeedDemoOrchestratorProvider implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedDemoOrchestratorProvider.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly seedCategoriesProvider: SeedCategoriesProvider,
    private readonly seedProductsProvider: SeedProductsProvider,
    private readonly seedCustomersProvider: SeedCustomersProvider,
  ) {}

  public async onApplicationBootstrap(): Promise<void> {
    if (!this.shouldSeedDemoData()) {
      return;
    }

    this.logger.log('Starting demo data seeding...');

    const categoryResult = await this.seedCategoriesProvider.seed();
    const productResult = await this.seedProductsProvider.seed();
    const customerResult = await this.seedCustomersProvider.seed();

    this.logSummary(categoryResult, productResult, customerResult);
  }

  private shouldSeedDemoData(): boolean {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      this.logger.warn(
        'Demo seeding skipped — SEED_DEMO_DATA is ignored in production.',
      );
      return false;
    }

    const seedDemoData = this.configService.get<string | boolean>(
      'SEED_DEMO_DATA',
    );

    if (seedDemoData !== true && seedDemoData !== 'true') {
      this.logger.debug(
        'Demo seeding skipped. Set SEED_DEMO_DATA=true to enable it.',
      );
      return false;
    }

    return true;
  }

  private logSummary(
    categoryResult: SeedResult,
    productResult: SeedResult,
    customerResult: SeedResult,
  ): void {
    const format = (label: string, result: SeedResult): string => {
      if (result.skipped) {
        return `${label}: skipped (${result.reason ?? 'already exists'})`;
      }

      return `${label}: ${result.created} created`;
    };

    this.logger.log(
      [
        'Demo seeding complete.',
        format('Categories', categoryResult),
        format('Products', productResult),
        format('Customers', customerResult),
      ].join(' '),
    );
  }
}
