import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Category name',
    description: 'Category name',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'Category description',
    description: 'Category description',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(1000)
  description: string;
}
