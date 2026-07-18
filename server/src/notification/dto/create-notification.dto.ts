import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../constants/notification.constants';
import { IsEnum, IsInt, IsString, MaxLength, MinLength } from 'class-validator';

/** Internal DTO — used when other modules create in-app notifications. */
export class CreateNotificationDto {
  @ApiProperty({ description: 'Recipient user id' })
  @IsInt()
  userId: number;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  message: string;
}
