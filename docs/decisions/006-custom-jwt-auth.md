# ADR-006: Custom JWT authentication (not Clerk)

## Status

Accepted

## Context

The app needs email/password auth, refresh rotation, blocked-user handling, and role claims across Nest and Next middleware/BFF.

## Decision

Authentication is **custom JWT** (not Clerk / Auth.js):

- **Nest:** `@nestjs/jwt` + bcrypt; access + refresh tokens; refresh families with reuse revocation
- **Next session:** httpOnly `access_token` (Next JWT via `jose`, `typ: "access"`) for middleware / BFF session checks
- **Nest tokens in cookies:** httpOnly `backend_access_token` (forwarded by BFF) and `refresh_token` (refresh Route Handler only)
- **Zustand:** persists **user only**; Nest access token is memory-only and rehydrated via `/api/v1/auth/refresh`

Roles: `BUYER` \| `SELLER` \| `SUPER_ADMIN` (multi-role via `UserRole`).

Guards: `AuthenticationGuard` + `AccessTokenGuard` under `server/src/modules/auth/guards/`; `RolesGuard` under `server/src/common/guards/`.

## Why

Historical rationale is not documented. Both walkthroughs explicitly state auth is not Clerk, and the implementation matches that.

## Consequences

- Do not assume Clerk (or Auth.js) middleware/session helpers exist
- Cookie names and refresh flows are load-bearing for BFF and middleware
- Blocked users are cleared/redirected via existing guards

## AI Guidance

- MUST NOT introduce Clerk/Auth.js as a replacement without an explicit migration task and ADR update
- MUST reuse existing auth modules, cookie helpers, and refresh interceptor behavior
- MUST keep role checks aligned with `modules/auth/utils/roles.ts` (client) and Nest `@Roles` / `hasAnyRole`
- MUST distinguish Next session JWT (`access_token`) from Nest access JWT (`backend_access_token` / memory bearer)

## Related Code

- `server/src/modules/auth/` (including `guards/`)
- `server/src/common/guards/roles/roles.guard.ts`
- `client/src/modules/auth/`
- `client/src/lib/server-auth.ts`, `auth-cookies.ts`, `require-auth.ts`
- `client/src/middleware.ts`, `client/src/store/auth-store.ts`
