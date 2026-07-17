import { ApiProperty } from '@nestjs/swagger';
import { ProductFileType } from '../constants/file.constants';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class UploadProductFileDto {
  @ApiProperty({
    enum: ProductFileType,
    example: ProductFileType.GALLERY,
    description: 'Product file type',
  })
  @IsEnum(ProductFileType)
  @IsNotEmpty()
  type: ProductFileType;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file (jpeg, png, gif, webp)',
  })
  @IsOptional()
  file?: Express.Multer.File;
}
