import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsPositive } from 'class-validator';

export class PaginationQueryDto {
  @ApiProperty({
    description: 'The page number',
    example: 1,
  })
  @IsOptional()
  @IsPositive()
  page: number = 1;

  @ApiProperty({
    description: 'The number of items to return',
    example: 10,
  })
  @IsOptional()
  @IsPositive()
  limit: number = 10;
}
