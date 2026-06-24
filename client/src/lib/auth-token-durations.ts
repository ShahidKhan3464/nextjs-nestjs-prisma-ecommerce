/** Seconds — Nest access JWT, Next session + `backend_access_token` cookies, and API `expiresIn`. */
export const ACCESS_TOKEN_TTL_SECONDS = 2 * 24 * 60 * 60;

/** Seconds — Nest refresh JWT and `refresh_token` httpOnly cookie max-age. */
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
