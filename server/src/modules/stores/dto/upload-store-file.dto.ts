import { ApiProperty } from '@nestjs/swagger';
import { StoreFileType } from '../constants/store.constants';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class UploadStoreFileDto {
  @ApiProperty({
    enum: StoreFileType,
    example: StoreFileType.LOGO,
    description: 'Store image type (LOGO or BANNER)',
  })
  @IsEnum(StoreFileType)
  @IsNotEmpty()
  type: StoreFileType;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file (jpeg, png, gif, webp)',
  })
  @IsOptional()
  file?: Express.Multer.File;
}
