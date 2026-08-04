import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class SetDefaultAddressDto {
  @ApiPropertyOptional({
    description: 'Mark this address as the default shipping address',
  })
  @IsOptional()
  @IsBoolean()
  shipping?: boolean;

  @ApiPropertyOptional({
    description: 'Mark this address as the default billing address',
  })
  @IsOptional()
  @IsBoolean()
  billing?: boolean;
}
