import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { SeedAdminProvider } from './providers/seed-admin.provider.js';
import { SeedProductsProvider } from './providers/seed-products.provider.js';
import { SeedCustomersProvider } from './providers/seed-customers.provider.js';
import { SeedCategoriesProvider } from './providers/seed-categories.provider.js';
import { SeedDemoOrchestratorProvider } from './providers/seed-demo-orchestrator.provider.js';

@Module({
  imports: [AuthModule],
  providers: [
    SeedAdminProvider,
    SeedProductsProvider,
    SeedCustomersProvider,
    SeedCategoriesProvider,
    SeedDemoOrchestratorProvider,
  ],
})
export class SeedersModule {}
