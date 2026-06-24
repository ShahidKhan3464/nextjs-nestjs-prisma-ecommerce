/**
 * Three httpOnly cookies after login / refresh (see login + refresh Route Handlers):
 *
 * 1. `AUTH_SESSION_COOKIE` — Next.js session JWT (`typ: "access"`). Used by `middleware` for
 *    protected routes; not the Nest API bearer.
 * 2. `AUTH_BACKEND_ACCESS_COOKIE` — Nest access JWT. Copied into the client store as
 *    `accessToken` for `Authorization: Bearer …` on `/api/v1/*` → Nest proxies.
 * 3. `AUTH_REFRESH_COOKIE` — Nest refresh JWT. Never readable from client JS; refresh calls
 *    send it automatically (`credentials`). The refresh Route Handler reads it and POSTs
 *    `{ refreshToken }` to Nest `POST /auth/refresh`.
 */
export const AUTH_SESSION_COOKIE = "access_token";

/** Nest access JWT forwarded to the Nest API from Route Handlers (`Authorization` fallbacks). */
export const AUTH_BACKEND_ACCESS_COOKIE = "backend_access_token";

/** Nest refresh JWT; consumed only on the server when exchanging for new Nest + session tokens. */
export const AUTH_REFRESH_COOKIE = "refresh_token";
