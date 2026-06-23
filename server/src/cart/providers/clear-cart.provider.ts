import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClearCartProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async clear(userId: number): Promise<void> {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
  }
}
