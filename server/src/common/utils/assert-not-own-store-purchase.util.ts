import { BadRequestException } from '@nestjs/common';

export const OWN_STORE_PURCHASE_MESSAGE =
  'You cannot purchase products from your own store';

/** Buyers cannot add/checkout items whose store is owned by the same user. */
export function assertNotOwnStorePurchase(
  buyerUserId: number,
  storeOwnerUserId: number | null | undefined,
): void {
  if (
    storeOwnerUserId != null &&
    Number.isFinite(storeOwnerUserId) &&
    storeOwnerUserId === buyerUserId
  ) {
    throw new BadRequestException(OWN_STORE_PURCHASE_MESSAGE);
  }
}
