import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { GetAdminDashboardProvider } from './providers/get-admin-dashboard.provider';
import { GetCustomerDashboardProvider } from './providers/get-customer-dashboard.provider';

@Module({
  providers: [
    DashboardService,
    GetAdminDashboardProvider,
    GetCustomerDashboardProvider,
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
