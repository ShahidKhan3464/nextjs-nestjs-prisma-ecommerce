import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { GetAdminDashboardProvider } from './providers/get-admin-dashboard.provider';
import { GetSellerDashboardProvider } from './providers/get-seller-dashboard.provider';
import { GetCustomerDashboardProvider } from './providers/get-customer-dashboard.provider';

@Module({
  providers: [
    DashboardService,
    GetAdminDashboardProvider,
    GetSellerDashboardProvider,
    GetCustomerDashboardProvider,
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
