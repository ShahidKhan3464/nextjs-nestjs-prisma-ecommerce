import { Get, Controller } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import {
  AdminDashboardResponseDto,
  CustomerDashboardResponseDto,
} from './dto/dashboard-response.dto';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: AdminDashboardResponseDto })
  getAdminOverview() {
    return this.dashboardService.getAdminOverview();
  }

  @Get('customer')
  @ApiOkResponse({ type: CustomerDashboardResponseDto })
  getCustomerOverview(@ActiveUser() userId: number) {
    return this.dashboardService.getCustomerOverview(userId);
  }
}
