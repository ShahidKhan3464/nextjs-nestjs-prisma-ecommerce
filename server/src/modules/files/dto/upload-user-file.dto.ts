import { ApiProperty } from '@nestjs/swagger';
import { UserFileType } from '../constants/file.constants';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class UploadUserFileDto {
  @ApiProperty({
    enum: UserFileType,
    example: UserFileType.AVATAR,
    description: 'User file type (AVATAR, COVER, or DOCUMENT)',
  })
  @IsEnum(UserFileType)
  @IsNotEmpty()
  type: UserFileType;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image (avatar/cover) or PDF/image document',
  })
  @IsOptional()
  file?: Express.Multer.File;
}
