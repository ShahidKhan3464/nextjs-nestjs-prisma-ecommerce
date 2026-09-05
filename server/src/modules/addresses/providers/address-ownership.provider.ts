import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AddressOwnershipProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async getOwnedOrThrow(id: number, userId: number) {
    const address = await this.prisma.userAddress.findFirst({
      where: { id, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }
}
