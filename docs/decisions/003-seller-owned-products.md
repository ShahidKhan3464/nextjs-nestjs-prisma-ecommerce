# ADR-003: Product catalog mutations are seller-owned

## Status

Accepted

## Context

In a multi-vendor marketplace, products and variants belong to a seller’s store. Admins moderate platform entities (users, categories, seller applications, stores) but are not product editors in this codebase.

## Decision

- Nest product create/update/publish/archive/soft-delete/restore require `SELLER` (not `SUPER_ADMIN`)
- Client product create/edit uses **seller** modules and `/api/v1/seller/products/*`
- There is **no** `/api/v1/admin/products/*` BFF (and no admin products feature module on disk)
- Product create resolves the authenticated seller’s store via `ProductOwnershipProvider` / `resolveStoreForCreate` (create DTO does not accept a client `storeId`)

## Why

Historical rationale is not documented. Enforced in Nest `@Roles(UserRole.SELLER)`, `ProductOwnershipProvider`, and client routing/middleware.

## Consequences

- Admin UIs must not gain product CRUD via a new admin API without an explicit product decision
- Suspended / unapproved sellers are blocked from product writes per ownership checks
- Variant mutations follow the same seller ownership model (`product-variants` module)

## AI Guidance

- MUST NOT add admin product mutation endpoints unless the user explicitly redesigns this decision (then update this ADR)
- MUST reuse `ProductOwnershipProvider` / variant ownership patterns for catalog writes
- MUST keep seller product pages wired to seller BFF even if routes sit under the `(admin)` route group for layout
- MUST NOT introduce client-supplied store ownership for product create

## Related Code

- `server/src/modules/products/`
- `server/src/modules/products/providers/product-ownership.provider.ts`
- `server/src/modules/product-variants/`
- `client/src/modules/seller/products/`
- `client/src/app/api/v1/seller/products/`
