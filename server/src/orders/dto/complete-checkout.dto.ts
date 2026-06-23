import { IsString, MinLength } from 'class-validator';

export class CompleteCheckoutDto {
  @IsString()
  @MinLength(1)
  paymentIntentId: string;
}
