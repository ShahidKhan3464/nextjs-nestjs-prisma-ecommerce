import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GetUnreadCountProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async countByUser(userId: number): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    return { count };
  }
}
