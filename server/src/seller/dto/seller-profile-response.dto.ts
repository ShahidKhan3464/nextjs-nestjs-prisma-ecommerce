import { StoreStatus } from 'src/store/constants/store.constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SellerDocumentType,
  SellerProfileStatus,
} from '../constants/seller.constants';

export class SellerDocumentFileResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'license.pdf' })
  originalName: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;

  @ApiProperty({ example: 204800 })
  fileSize: number;

  @ApiProperty({ example: '/files/secure/123' })
  urlPath: string;

  @ApiProperty({ example: '2026-07-14T10:00:00.000Z' })
  createdAt: Date;
}

export class SellerDocumentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: SellerDocumentType })
  type: SellerDocumentType;

  @ApiProperty({ type: SellerDocumentFileResponseDto })
  file: SellerDocumentFileResponseDto;
}

export class SellerStoreSummaryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

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
    example: '2026-07-14T12:00:00.000Z',
    nullable: true,
  })
  suspendedAt: Date | null;

  @ApiPropertyOptional({
    example: '2026-07-14T11:00:00.000Z',
    nullable: true,
  })
  verifiedAt: Date | null;

  @ApiProperty({ example: '2026-07-14T11:00:00.000Z' })
  createdAt: Date;
}

export class SellerProfileResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 42 })
  userId: number;

  @ApiProperty({ example: 'Acme Trading LLC' })
  businessName: string;

  @ApiProperty({ example: 'seller@acme.com' })
  businessEmail: string;

  @ApiProperty({ example: '+1234567890' })
  businessPhone: string;

  @ApiPropertyOptional({ example: 'TAX-123456789', nullable: true })
  taxNumber: string | null;

  @ApiPropertyOptional({ example: 'REG-987654', nullable: true })
  registrationNumber: string | null;

  @ApiProperty({ enum: SellerProfileStatus })
  status: SellerProfileStatus;

  @ApiPropertyOptional({
    example: '2026-07-14T11:00:00.000Z',
    nullable: true,
  })
  approvedAt: Date | null;

  @ApiPropertyOptional({
    example: 'Incomplete documents',
    nullable: true,
  })
  rejectedReason: string | null;

  @ApiProperty({ example: '2026-07-14T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-14T10:30:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({
    type: SellerStoreSummaryResponseDto,
    nullable: true,
  })
  store: SellerStoreSummaryResponseDto | null;

  @ApiProperty({ type: [SellerDocumentResponseDto] })
  documents: SellerDocumentResponseDto[];
}
