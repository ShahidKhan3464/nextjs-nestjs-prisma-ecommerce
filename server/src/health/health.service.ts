import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  async ready(): Promise<{ status: 'ok' }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
