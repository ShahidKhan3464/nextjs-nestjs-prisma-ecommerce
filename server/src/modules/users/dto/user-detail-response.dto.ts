import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';
import {
  OrderAddressDto,
  OrderResponseDto,
} from 'src/modules/orders/dto/order-response.dto';

/** Mirrors `UserDetailResponse` from get-user-detail.provider. */
export class UserDetailResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  totalSpending: number;

  @ApiProperty()
  wishlistCount: number;

  @ApiPropertyOptional()
  profilePhotoUrl?: string;

  @ApiProperty({ type: [OrderResponseDto] })
  recentOrders: OrderResponseDto[];

  @ApiPropertyOptional({ type: OrderAddressDto })
  defaultAddress?: OrderAddressDto;

  @ApiProperty({ type: [OrderAddressDto] })
  billingAddresses: OrderAddressDto[];

  @ApiProperty({ type: [OrderAddressDto] })
  shippingAddresses: OrderAddressDto[];
}

export class PaginatedUserResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;
}
