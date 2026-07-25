import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewBuyerDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Public display name' })
  displayName: string;
}

export class ReviewProductSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  storeId: string;
}

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  rating: number;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  comment?: string;

  @ApiProperty({ type: ReviewBuyerDto })
  buyer: ReviewBuyerDto;

  @ApiPropertyOptional({ type: ReviewProductSummaryDto })
  product?: ReviewProductSummaryDto;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
