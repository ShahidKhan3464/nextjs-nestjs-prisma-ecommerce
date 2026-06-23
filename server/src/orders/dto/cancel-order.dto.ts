import { IsString, MinLength, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}
