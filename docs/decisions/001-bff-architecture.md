# ADR-001: Next.js BFF for business APIs

## Status

Accepted

## Context

The storefront is a Next.js app and the API is a NestJS service. Authenticated JSON traffic must keep Nest tokens and response mapping centralized in Route Handlers.

## Decision

Browser and SSR **business API** calls use Next.js Route Handlers under `client/src/app/api/v1/**` (Axios → `/api/v1/...`). Those handlers proxy to Nest (`BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL` fallback), forward authorization, unwrap Nest `{ data, version }`, and map payloads via `client/src/lib/nest-*-mapper.ts`.

**Exception (assets only):** public files under Nest `/uploads/**` may be referenced directly for images (`resolveUploadUrl`, Next `images.remotePatterns`). Private files must not use public `/uploads` (see ADR-007).

## Why

Historical rationale is not documented. The pattern is consistently implemented across auth, admin, customer, and seller BFF routes.

## Consequences

- New UI features need matching BFF routes (or reuse of existing ones), not a Nest Axios base for JSON APIs
- Nest path shapes and BFF path shapes can differ by role prefix (`/api/v1/{admin|customer|seller}/…`)
- Mapping bugs belong in BFF/mappers, not ad-hoc page parsing of Nest envelopes
- SSR Axios uses `getSiteUrl()` so server-rendered code still hits this Next app’s Route Handlers

## AI Guidance

- MUST route client JSON/auth HTTP through `/api/v1/...` using the existing Axios client
- MUST NOT introduce a Nest base URL for authenticated or catalog business APIs in the browser
- MUST follow an existing Route Handler in the same role folder for new endpoints
- MUST NOT put heavy domain business rules in BFF handlers beyond auth, validation, forward, and mapping
- MUST NOT treat public `/uploads` URLs as an API or as access to private documents

## Related Code

- `client/src/app/api/v1/`
- `client/src/services/api/client.ts`
- `client/src/lib/nest-http.ts`, `backend-url.ts`, `nest-*-mapper.ts`, `resolve-upload-url.ts`
- `client/walkthrough.md` (BFF API routes)
