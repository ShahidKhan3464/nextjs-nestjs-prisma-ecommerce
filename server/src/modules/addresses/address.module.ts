import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { GetAddressesProvider } from './providers/get-addresses.provider';
import { CreateAddressProvider } from './providers/create-address.provider';
import { UpdateAddressProvider } from './providers/update-address.provider';
import { DeleteAddressProvider } from './providers/delete-address.provider';
import { AddressOwnershipProvider } from './providers/address-ownership.provider';
import { SetDefaultAddressProvider } from './providers/set-default-address.provider';

@Module({
  controllers: [AddressController],
  providers: [
    AddressService,
    GetAddressesProvider,
    CreateAddressProvider,
    UpdateAddressProvider,
    DeleteAddressProvider,
    AddressOwnershipProvider,
    SetDefaultAddressProvider,
  ],
})
export class AddressModule {}
