import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AddressResponse,
  mapAddressToResponse,
} from '../utils/map-address.util';

@Injectable()
export class GetAddressesProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async findMine(userId: number): Promise<AddressResponse[]> {
    const rows = await this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefaultShipping: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapAddressToResponse);
  }
}
