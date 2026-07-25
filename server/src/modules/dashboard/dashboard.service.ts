import { Injectable } from '@nestjs/common';
import { GetAdminDashboardProvider } from './providers/get-admin-dashboard.provider';
import { GetCustomerDashboardProvider } from './providers/get-customer-dashboard.provider';
import {
  AdminDashboardResponse,
  CustomerDashboardResponse,
} from './utils/dashboard.types';

@Injectable()
export class DashboardService {
  constructor(
    private readonly getAdminDashboardProvider: GetAdminDashboardProvider,
    private readonly getCustomerDashboardProvider: GetCustomerDashboardProvider,
  ) {}

  public async getAdminOverview(): Promise<AdminDashboardResponse> {
    return this.getAdminDashboardProvider.getOverview();
  }

  public async getCustomerOverview(
    userId: number,
  ): Promise<CustomerDashboardResponse> {
    return this.getCustomerDashboardProvider.getOverview(userId);
  }
}
