import { HealthService } from './health.service';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/constants/auth.constants';
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @Auth(AuthType.NONE)
  @ApiOperation({ summary: 'Liveness probe (process is up)' })
  live() {
    return this.healthService.live();
  }

  @Get('ready')
  @Auth(AuthType.NONE)
  @ApiOperation({ summary: 'Readiness probe (database is reachable)' })
  async ready() {
    try {
      return await this.healthService.ready();
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }
  }
}
