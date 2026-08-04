import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional({ nullable: true })
  label: string | null;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  line1: string;

  @ApiPropertyOptional({ nullable: true })
  line2: string | null;

  @ApiProperty()
  city: string;

  @ApiProperty()
  region: string;

  @ApiProperty()
  postalCode: string;

  @ApiProperty()
  country: string;

  @ApiPropertyOptional({ nullable: true })
  phone: string | null;

  @ApiProperty()
  isDefaultShipping: boolean;

  @ApiProperty()
  isDefaultBilling: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
