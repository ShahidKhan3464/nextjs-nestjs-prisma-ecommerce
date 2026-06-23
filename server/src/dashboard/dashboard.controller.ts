import { Get, Controller } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/constants/user.constants';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles(UserRole.ADMIN)
  getAdminOverview() {
    return this.dashboardService.getAdminOverview();
  }

  @Get('customer')
  getCustomerOverview(@ActiveUser() userId: number) {
    return this.dashboardService.getCustomerOverview(userId);
  }
}
