import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

export class QueryUserDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['true', 'false'],
    description: 'Filter blocked (true) or active/unblocked (false) users',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  isBlocked?: 'true' | 'false';

  @ApiPropertyOptional({
    description: 'Search by name or email',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}

export function parseUserBlockedFilter(raw?: string): boolean | undefined {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return undefined;
}
