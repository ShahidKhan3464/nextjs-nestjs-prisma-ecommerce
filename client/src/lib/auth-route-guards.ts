/** Shared route classification for middleware + client redirects (no server-only imports). */

export function isProtectedShopPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/users")
  );
}

/** Path (+ optional query); internal + shop-protected only — avoids open redirects. */
export function safeProtectedRedirectPath(
  raw: string | null | undefined
): string | null {
  if (raw == null || raw === "") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  let pathOnly: string;
  try {
    pathOnly = new URL(trimmed, "http://local.invalid").pathname;
  } catch {
    return null;
  }
  if (!isProtectedShopPath(pathOnly)) return null;
  return trimmed;
}
