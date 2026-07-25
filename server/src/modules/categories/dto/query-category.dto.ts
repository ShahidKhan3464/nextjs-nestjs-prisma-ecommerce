import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

export class QueryCategoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search in category name (case-insensitive)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'name'],
    default: 'name',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'name'])
  sortBy?: 'createdAt' | 'updatedAt' | 'name' = 'name';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';

  @ApiPropertyOptional({
    enum: ['active', 'removed', 'all'],
    default: 'active',
  })
  @IsOptional()
  @IsIn(['active', 'removed', 'all'])
  lifeCycle?: 'active' | 'removed' | 'all' = 'active';
}
