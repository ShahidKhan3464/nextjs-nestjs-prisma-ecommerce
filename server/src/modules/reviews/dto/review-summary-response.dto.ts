import { ApiProperty } from '@nestjs/swagger';

export class RatingDistributionDto {
  @ApiProperty()
  1: number;

  @ApiProperty()
  2: number;

  @ApiProperty()
  3: number;

  @ApiProperty()
  4: number;

  @ApiProperty()
  5: number;
}

export class ReviewSummaryResponseDto {
  @ApiProperty()
  productId: string;

  @ApiProperty({ description: 'Average rating 0–5, one decimal' })
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty({ type: RatingDistributionDto })
  distribution: RatingDistributionDto;
}

export class StoreReputationResponseDto {
  @ApiProperty()
  storeId: string;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty()
  productsSold: number;

  @ApiProperty({ description: 'True when store.verifiedAt is set' })
  verified: boolean;
}
