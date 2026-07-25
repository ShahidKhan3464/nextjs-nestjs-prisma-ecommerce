import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { SellerDocumentType } from '../constants/seller.constants';

export class UploadSellerDocumentDto {
  @ApiProperty({
    enum: SellerDocumentType,
    example: SellerDocumentType.BUSINESS_LICENSE,
    description: 'Type of seller verification document',
  })
  @IsEnum(SellerDocumentType)
  @IsNotEmpty()
  type: SellerDocumentType;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Document file (pdf, jpeg, png, webp)',
  })
  @IsOptional()
  file?: Express.Multer.File;
}
