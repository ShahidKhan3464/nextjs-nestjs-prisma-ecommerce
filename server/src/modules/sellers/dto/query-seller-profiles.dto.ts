import { ApiPropertyOptional } from '@nestjs/swagger';
import { SellerProfileStatus } from '../constants/seller.constants';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

export class QuerySellerProfilesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SellerProfileStatus })
  @IsOptional()
  @IsEnum(SellerProfileStatus)
  status?: SellerProfileStatus;

  @ApiPropertyOptional({
    description: 'Search by business name or business email',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
