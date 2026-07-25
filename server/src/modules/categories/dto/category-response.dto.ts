import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Mirrors Prisma `Category` as returned by category providers. */
export class CategoryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  deletedAt: Date | null;
}

export class PaginatedCategoryResponseDto {
  @ApiProperty({ type: [CategoryResponseDto] })
  data: CategoryResponseDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;
}
