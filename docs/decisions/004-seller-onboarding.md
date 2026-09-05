# ADR-004: Multi-vendor seller onboarding flow

## Status

Accepted

## Context

Buyers can apply to sell. The platform must gate store creation, seller role assignment, document handling, and admin decisions.

## Decision

Canonical flow:

1. Authenticated `BUYER` applies via seller-profile APIs (client: `/become-seller`)
2. Applicant uploads private seller documents as required
3. `SUPER_ADMIN` lists/reviews applications and approve / reject / suspend / unsuspend
4. **Approve** (`ApproveSellerProfileProvider`) creates an `ACTIVE` store (sets `verifiedAt`), grants `SELLER` role if missing, and notifies the user
5. Client refreshes session so seller chrome unlocks

Nest surface: `SellerController` at `seller-profile` plus a second controller at `seller-profiles` for the admin list.

After onboarding, admin store moderation is verify / unverify / suspend / unsuspend — not generic admin PATCH/DELETE on stores. (Approval already sets `verifiedAt`; later verify/unverify still exist for moderation.)

Seller-profile **unsuspend** is the counterpart of profile suspend: restore `PENDING` if the profile was never approved, otherwise `APPROVED`, and unsuspend the store when suspend had cascaded to it. It does not re-run approve, grant roles, or send notifications.

## Why

Historical rationale is not documented. Implemented across Nest `sellers` + `stores` modules and client seller-registration / admin seller-profiles / stores features.

## Consequences

- Store creation is tied to approval, not an arbitrary public “create store” shortcut
- Seller documents remain private (see ADR-007)
- Role chrome depends on refreshed session roles after approval

## AI Guidance

- MUST follow existing approve/reject/suspend/unsuspend providers and BFF routes
- MUST NOT invent alternate onboarding that bypasses admin approval or role grant
- MUST treat seller documents as private files
- Before changing this flow, inspect `ApproveSellerProfileProvider` and related client session refresh behavior

## Related Code

- `server/src/modules/sellers/`
- `server/src/modules/stores/`
- `client/src/modules/customer/seller-registration/`
- `client/src/modules/admin/seller-profiles/`
- `client/src/app/api/v1/customer/seller-profile*/`
- `client/src/app/api/v1/admin/seller-profiles*/`
