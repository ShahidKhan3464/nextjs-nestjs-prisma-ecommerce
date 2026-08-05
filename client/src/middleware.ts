import { NextResponse } from "next/server";
import { ROUTES } from "@/constants/routes";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/server-auth";
import { isSeller, isSuperAdmin } from "@/modules/auth/utils/roles";
import {
  isAdminOnlyPath,
  isProtectedShopPath,
  safeProtectedRedirectPath,
  isSellerOrAdminProductPath,
  isSellerOrAdminStorePath,
} from "@/lib/auth-route-guards";
import {
  AUTH_SESSION_COOKIE,
  AUTH_REFRESH_COOKIE,
  AUTH_BACKEND_ACCESS_COOKIE,
} from "@/lib/auth-cookies";

const PUBLIC_AUTH_PREFIXES = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
] as const;

function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isMarketingPath(pathname: string): boolean {
  return pathname === ROUTES.home;
}

const RETURN_PATH_COOKIE = "shop_return_path";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  /** Historical `/admin` URLs → canonical paths (same URLs as post-login admin) */
  if (pathname === "/admin" || pathname === "/admin/") {
    url.pathname = ROUTES.dashboard;
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin/")) {
    url.pathname = pathname.slice("/admin".length) || ROUTES.dashboard;
    return NextResponse.redirect(url);
  }

  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;

  const wantsPublicOnly =
    isPublicAuthPath(pathname) || isMarketingPath(pathname);

  if (wantsPublicOnly) {
    if (payload && payload.typ === "access") {
      const back = safeProtectedRedirectPath(
        request.cookies.get(RETURN_PATH_COOKIE)?.value
      );
      return NextResponse.redirect(
        new URL(back ?? ROUTES.dashboard, request.url)
      );
    }
    return NextResponse.next();
  }

  if (!isProtectedShopPath(pathname)) {
    return NextResponse.next();
  }

  if (!token || !payload || payload.typ !== "access") {
    const login = new URL(ROUTES.login, request.url);
    login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  if (payload.isBlocked) {
    const login = new URL(ROUTES.login, request.url);
    login.searchParams.set("blocked", "1");
    const res = NextResponse.redirect(login);
    res.cookies.delete(AUTH_SESSION_COOKIE);
    res.cookies.delete(AUTH_BACKEND_ACCESS_COOKIE);
    res.cookies.delete(AUTH_REFRESH_COOKIE);
    res.cookies.delete(RETURN_PATH_COOKIE);
    return res;
  }

  if (isAdminOnlyPath(pathname) && !isSuperAdmin(payload.roles)) {
    return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
  }

  if (
    isSellerOrAdminProductPath(pathname) &&
    !isSuperAdmin(payload.roles) &&
    !isSeller(payload.roles)
  ) {
    return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
  }

  if (
    isSellerOrAdminStorePath(pathname) &&
    !isSuperAdmin(payload.roles) &&
    !isSeller(payload.roles)
  ) {
    return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
  }

  const res = NextResponse.next();
  res.cookies.set(RETURN_PATH_COOKIE, `${pathname}${request.nextUrl.search}`, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
