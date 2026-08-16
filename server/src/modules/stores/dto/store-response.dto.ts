import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreStatus, StoreFileType } from '../constants/store.constants';
import { SellerProfileStatus } from 'src/modules/sellers/constants/seller.constants';

export class StoreFileAssetResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'logo.png' })
  originalName: string;

  @ApiProperty({ example: 'image/png' })
  mimeType: string;

  @ApiProperty({ example: 204800 })
  fileSize: number;

  @ApiProperty({ example: '/uploads/stores/logo-123.png' })
  urlPath: string;

  @ApiProperty({ example: '2026-07-14T10:00:00.000Z' })
  createdAt: Date;
}

export class StoreFileResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: StoreFileType })
  type: StoreFileType;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ type: StoreFileAssetResponseDto })
  file: StoreFileAssetResponseDto;
}

export class StoreSellerProfileSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiPropertyOptional({
    example: 42,
    description:
      'Seller user id (owner/admin only; omitted on public storefront)',
  })
  userId?: number;

  @ApiProperty({
    enum: SellerProfileStatus,
    example: SellerProfileStatus.APPROVED,
  })
  status: SellerProfileStatus;

  @ApiProperty({ example: 'Acme Trading LLC' })
  businessName: string;
}

export class StoreResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  sellerProfileId: number;

  @ApiProperty({ example: 'Acme Store' })
  name: string;

  @ApiProperty({ example: 'acme-store' })
  slug: string;

  @ApiProperty({ enum: StoreStatus })
  status: StoreStatus;

  @ApiProperty({ example: '123 Market Street' })
  address: string;

  @ApiProperty({ example: 'New York' })
  city: string;

  @ApiProperty({ example: '10001' })
  postalCode: string;

  @ApiProperty({ example: 'United States' })
  country: string;

  @ApiPropertyOptional({ example: 'Quality goods from Acme', nullable: true })
  description: string | null;

  @ApiPropertyOptional({
    example: '2026-07-14T11:00:00.000Z',
    nullable: true,
  })
  verifiedAt: Date | null;

  @ApiPropertyOptional({
    example: '2026-07-14T12:00:00.000Z',
    nullable: true,
  })
  suspendedAt: Date | null;

  @ApiPropertyOptional({
    example: 'Policy violations',
    nullable: true,
  })
  suspensionReason: string | null;

  @ApiProperty({ example: '2026-07-14T11:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-14T11:30:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: StoreSellerProfileSummaryDto })
  sellerProfile: StoreSellerProfileSummaryDto;

  @ApiProperty({ type: [StoreFileResponseDto] })
  files: StoreFileResponseDto[];

  @ApiPropertyOptional({ description: 'Average product review rating' })
  averageRating?: number;

  @ApiPropertyOptional()
  totalReviews?: number;

  @ApiPropertyOptional()
  productsSold?: number;
}
