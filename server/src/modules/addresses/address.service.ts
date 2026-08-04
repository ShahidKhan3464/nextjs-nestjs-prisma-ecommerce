import { Injectable } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { SetDefaultAddressDto } from './dto/set-default-address.dto';
import { GetAddressesProvider } from './providers/get-addresses.provider';
import { CreateAddressProvider } from './providers/create-address.provider';
import { UpdateAddressProvider } from './providers/update-address.provider';
import { DeleteAddressProvider } from './providers/delete-address.provider';
import { SetDefaultAddressProvider } from './providers/set-default-address.provider';

@Injectable()
export class AddressService {
  constructor(
    private readonly getAddressesProvider: GetAddressesProvider,
    private readonly createAddressProvider: CreateAddressProvider,
    private readonly updateAddressProvider: UpdateAddressProvider,
    private readonly deleteAddressProvider: DeleteAddressProvider,
    private readonly setDefaultAddressProvider: SetDefaultAddressProvider,
  ) {}

  findMine(userId: number) {
    return this.getAddressesProvider.findMine(userId);
  }

  create(userId: number, dto: CreateAddressDto) {
    return this.createAddressProvider.create(userId, dto);
  }

  update(userId: number, id: number, dto: UpdateAddressDto) {
    return this.updateAddressProvider.update(userId, id, dto);
  }

  delete(userId: number, id: number) {
    return this.deleteAddressProvider.delete(userId, id);
  }

  setDefault(userId: number, id: number, dto: SetDefaultAddressDto) {
    return this.setDefaultAddressProvider.setDefault(userId, id, dto);
  }
}
