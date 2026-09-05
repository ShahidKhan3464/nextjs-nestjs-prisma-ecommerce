import { BadRequestException } from '@nestjs/common';
import {
  ProductStatus,
  PRODUCT_STATUS_TRANSITIONS,
} from '../constants/product.constants';

export function assertProductStatusTransition(
  from: ProductStatus,
  to: ProductStatus,
): void {
  const allowed = PRODUCT_STATUS_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Cannot transition product from ${from} to ${to}`,
    );
  }
}
