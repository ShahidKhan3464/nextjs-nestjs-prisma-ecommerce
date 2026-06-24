import { Type } from 'class-transformer';
import {
  IsString,
  MinLength,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class ShippingAddressDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsString()
  @MinLength(2)
  line1: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  @MinLength(1)
  city: string;

  @IsString()
  @MinLength(1)
  region: string;

  @IsString()
  @MinLength(1)
  postalCode: string;

  @IsString()
  @MinLength(2)
  country: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateCheckoutDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;
}
