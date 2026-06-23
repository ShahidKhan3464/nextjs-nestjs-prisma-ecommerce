import { AuthModule } from 'src/auth/auth.module';
import { Module, forwardRef } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { GetAdminDashboardProvider } from './providers/get-admin-dashboard.provider';
import { GetCustomerDashboardProvider } from './providers/get-customer-dashboard.provider';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [
    DashboardService,
    GetAdminDashboardProvider,
    GetCustomerDashboardProvider,
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
