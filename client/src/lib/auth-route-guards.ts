/** Shared route classification for middleware + client redirects (no server-only imports). */

/** Paths that require SUPER_ADMIN (nav + middleware). */
export function isAdminOnlyPath(pathname: string): boolean {
  if (
    pathname.startsWith("/users") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/seller-profiles")
  ) {
    return true;
  }
  // Exact admin store list — do not treat public `/stores/:slug` as admin-only.
  if (pathname === "/stores" || pathname.startsWith("/stores/manage")) {
    return true;
  }
  return false;
}

/** Product create/edit/manage — SELLER only. */
export function isSellerProductPath(pathname: string): boolean {
  return (
    pathname === "/products/new" ||
    pathname.startsWith("/products/new/") ||
    pathname.startsWith("/products/edit/") ||
    pathname.startsWith("/products/manage/")
  );
}

/** Seller store settings — SELLER only (not public `/stores/...`). */
export function isSellerStorePath(pathname: string): boolean {
  return pathname === "/store" || pathname.startsWith("/store/");
}

/** Public catalog — storefront + product browse (seller manage/edit stay protected). */
function isPublicCatalogPath(pathname: string): boolean {
  if (pathname === "/stores" || pathname.startsWith("/stores/manage")) {
    return false;
  }
  if (pathname.startsWith("/stores/")) return true;
  if (isSellerProductPath(pathname)) return false;
  return pathname === "/products" || pathname.startsWith("/products/");
}

export function isProtectedShopPath(pathname: string): boolean {
  if (isPublicCatalogPath(pathname)) return false;

  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/payments") ||
    isSellerProductPath(pathname) ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/reviews") ||
    pathname.startsWith("/become-seller") ||
    pathname.startsWith("/seller-profiles") ||
    pathname === "/stores" ||
    pathname.startsWith("/stores/manage") ||
    // Exact seller store settings — do not match public `/stores/...`
    isSellerStorePath(pathname)
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
