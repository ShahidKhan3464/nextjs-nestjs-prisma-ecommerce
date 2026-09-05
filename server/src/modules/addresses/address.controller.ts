import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { SetDefaultAddressDto } from './dto/set-default-address.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';

@ApiTags('addresses')
@ApiBearerAuth('access-token')
@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  @ApiOperation({ summary: 'List saved addresses for the authenticated user' })
  @ApiOkResponse({ type: AddressResponseDto, isArray: true })
  findMine(@ActiveUser() userId: number) {
    return this.addressService.findMine(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a saved address' })
  @ApiCreatedResponse({ type: AddressResponseDto })
  create(@ActiveUser() userId: number, @Body() dto: CreateAddressDto) {
    return this.addressService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a saved address (own only)' })
  @ApiOkResponse({ type: AddressResponseDto })
  update(
    @ActiveUser() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved address (own only)' })
  delete(@ActiveUser() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.addressService.delete(userId, id);
  }

  @Patch(':id/default')
  @ApiOperation({
    summary: 'Mark address as default shipping and/or billing (own only)',
  })
  @ApiOkResponse({ type: AddressResponseDto })
  setDefault(
    @ActiveUser() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetDefaultAddressDto,
  ) {
    return this.addressService.setDefault(userId, id, dto);
  }
}
