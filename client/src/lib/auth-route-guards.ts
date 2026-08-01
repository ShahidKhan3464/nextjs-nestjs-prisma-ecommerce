/** Shared route classification for middleware + client redirects (no server-only imports). */

/** Paths that require SUPER_ADMIN (nav + middleware). */
export function isAdminOnlyPath(pathname: string): boolean {
  return (
    pathname.startsWith("/users") || pathname.startsWith("/categories")
  );
}

/** Product create/edit/manage — SUPER_ADMIN or SELLER. */
export function isSellerOrAdminProductPath(pathname: string): boolean {
  return (
    pathname === "/products/new" ||
    pathname.startsWith("/products/new/") ||
    pathname.startsWith("/products/edit/") ||
    pathname.startsWith("/products/manage/")
  );
}

/** Public catalog — storefront + product browse (seller manage/edit stay protected). */
function isPublicCatalogPath(pathname: string): boolean {
  if (pathname.startsWith("/stores")) return true;
  if (isSellerOrAdminProductPath(pathname)) return false;
  return pathname === "/products" || pathname.startsWith("/products/");
}

export function isProtectedShopPath(pathname: string): boolean {
  if (isPublicCatalogPath(pathname)) return false;

  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/orders") ||
    isSellerOrAdminProductPath(pathname) ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/become-seller") ||
    // Exact seller store settings — do not match public `/stores/...`
    pathname === "/store" ||
    pathname.startsWith("/store/")
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
