import { Get, Controller } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles(UserRole.SUPER_ADMIN)
  getAdminOverview() {
    return this.dashboardService.getAdminOverview();
  }

  @Get('customer')
  getCustomerOverview(@ActiveUser() userId: number) {
    return this.dashboardService.getCustomerOverview(userId);
  }
}
