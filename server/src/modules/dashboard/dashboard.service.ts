import { Injectable } from '@nestjs/common';
import { GetAdminDashboardProvider } from './providers/get-admin-dashboard.provider';
import { GetSellerDashboardProvider } from './providers/get-seller-dashboard.provider';
import { GetCustomerDashboardProvider } from './providers/get-customer-dashboard.provider';
import {
  AdminDashboardResponse,
  SellerDashboardResponse,
  CustomerDashboardResponse,
} from './utils/dashboard.types';

@Injectable()
export class DashboardService {
  constructor(
    private readonly getAdminDashboardProvider: GetAdminDashboardProvider,
    private readonly getSellerDashboardProvider: GetSellerDashboardProvider,
    private readonly getCustomerDashboardProvider: GetCustomerDashboardProvider,
  ) {}

  public async getAdminOverview(): Promise<AdminDashboardResponse> {
    return this.getAdminDashboardProvider.getOverview();
  }

  public async getSellerOverview(
    userId: number,
  ): Promise<SellerDashboardResponse> {
    return this.getSellerDashboardProvider.getOverview(userId);
  }

  public async getCustomerOverview(
    userId: number,
  ): Promise<CustomerDashboardResponse> {
    return this.getCustomerDashboardProvider.getOverview(userId);
  }
}
