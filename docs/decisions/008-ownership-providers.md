# ADR-008: Domain ownership providers

## Status

Accepted

## Context

Many resources are scoped to a user, seller store, or admin override. Authorization is not only role-based (`@Roles`); it also requires resource ownership checks.

## Decision

Domains that need resource scoping implement `*-ownership.provider.ts` (or equivalent assert helpers) used by mutating/reading providers. Examples exist for products, variants, stores, orders, payments, reviews, addresses, and notifications.

Not every module uses a dedicated ownership provider (e.g. carts/wishlists typically scope by authenticated `userId` inside the use-case). Follow the closest domain’s existing pattern.

Ownership providers typically:

- Resolve the actor’s owned store/profile
- Assert the resource belongs to that actor (or allowed admin path where the use-case already supports it)
- Enforce extra gates (approved seller, non-suspended store, non-deleted rows)

## Why

Historical rationale is not documented. The pattern is repeated across modules and is the safe extension point for new owned resources.

## Consequences

- New owned resources should add an ownership provider rather than scattering ad-hoc `userId` checks
- Role checks alone are insufficient for seller catalog and buyer-owned data

## AI Guidance

- MUST inspect and reuse the domain’s ownership provider before changing access rules
- MUST NOT weaken ownership checks to “make the UI work”
- MUST NOT invent a global generic ownership framework — follow per-module providers

## Related Code

- `server/src/modules/products/providers/product-ownership.provider.ts`
- `server/src/modules/product-variants/providers/variant-ownership.provider.ts`
- `server/src/modules/stores/providers/store-ownership.provider.ts`
- `server/src/modules/orders/providers/order-ownership.provider.ts`
- `server/src/modules/payments/providers/payment-ownership.provider.ts`
- `server/src/modules/reviews/providers/review-ownership.provider.ts`
- `server/src/modules/addresses/providers/address-ownership.provider.ts`
- `server/src/modules/notifications/providers/notification-ownership.provider.ts`
