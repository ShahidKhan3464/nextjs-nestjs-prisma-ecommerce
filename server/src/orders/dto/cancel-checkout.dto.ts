import { IsString, MinLength } from 'class-validator';

export class CancelCheckoutDto {
  @IsString()
  @MinLength(1)
  paymentIntentId: string;
}
