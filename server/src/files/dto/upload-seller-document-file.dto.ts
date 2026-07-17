import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { SellerDocumentType } from '../constants/file.constants';

export class UploadSellerDocumentFileDto {
  @ApiProperty({
    enum: SellerDocumentType,
    example: SellerDocumentType.BUSINESS_LICENSE,
    description: 'Seller verification document type',
  })
  @IsEnum(SellerDocumentType)
  @IsNotEmpty()
  type: SellerDocumentType;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'PDF or image document (jpeg, png, webp, pdf)',
  })
  @IsOptional()
  file?: Express.Multer.File;
}
