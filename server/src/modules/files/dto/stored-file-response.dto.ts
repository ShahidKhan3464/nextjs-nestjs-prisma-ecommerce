import { ApiProperty } from '@nestjs/swagger';

export class StoredFileResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: '/uploads/products/uuid.jpg' })
  urlPath: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ example: 204800 })
  fileSize: number;

  @ApiProperty({ example: 'jpg' })
  extension: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ example: 'photo.jpg' })
  originalName: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg' })
  storedName: string;
}

export class FileAssociationResponseDto {
  @ApiProperty({
    description:
      'Association row id (ProductFile / StoreFile / UserFile / SellerDocument)',
  })
  id: number;

  @ApiProperty({ example: 'THUMBNAIL' })
  type: string;

  @ApiProperty({ required: false })
  sortOrder?: number;

  @ApiProperty({ type: StoredFileResponseDto })
  file: StoredFileResponseDto;
}

export class DeleteFileResponseDto {
  @ApiProperty()
  deletedAssociationId: number;

  @ApiProperty({
    description:
      'True when StoredFile had no remaining associations and was removed',
  })
  deletedStoredFile: boolean;

  @ApiProperty()
  fileId: number;
}
