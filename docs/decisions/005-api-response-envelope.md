# ADR-005: Nest API response envelope `{ data, version }`

## Status

Accepted

## Context

Clients and BFF mappers need a stable success response shape from Nest. Versioning is expressed on the Nest envelope rather than a global Nest URL prefix.

## Decision

- **Nest:** `DataResponseInterceptor` wraps successful handler results as `{ data, version }`, where `version` comes from config `app.apiVersion` / env `API_VERSION` (default `v1`). Controllers mount at root paths without a global `/v1` prefix.
- **Next BFF:** Remaps under `/api/v1/{role}/…`, unwraps the Nest envelope (`unwrapNestDataResponsePayload`), and returns client-facing `ApiResponse<T>` shaped as `{ data: T; meta?: … }` — **without** a `version` field.
- Errors from BFF often use `{ message }` via `jsonMessage`, not the success envelope.

## Why

Historical rationale is not documented. Nest wrapping and client unwrap/map are consistently implemented.

## Consequences

- Changing the Nest envelope is a breaking change for BFF mappers
- `API_VERSION` is not a Nest route prefix
- AI must not assume the browser receives Nest’s `version` field

## AI Guidance

- MUST preserve Nest `{ data, version }` unless explicitly migrating both stacks
- MUST NOT invent parallel Nest success envelopes per module
- MUST update client mappers/types if shapes inside Nest `data` change
- MUST NOT add `version` to client `ApiResponse` unless intentionally aligning both sides

## Related Code

- `server/src/common/interceptors/data-response/data-response.interceptor.ts`
- `client/src/types/api.ts` (`ApiResponse`)
- `client/src/lib/api-response.ts`, `nest-http.ts`, `nest-*-mapper.ts`
