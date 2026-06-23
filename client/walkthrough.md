# Atelier Commerce — Client Walkthrough

This document describes the **Next.js 15** storefront under `client/`: folder layout, request flow, rendering modes, and where each file fits. Paths are relative to `client/` unless noted.

The client talks to a **NestJS backend** through a **BFF layer** (`src/app/api/v1/**`) that proxies requests, sets auth cookies, and maps API shapes to UI types.

---

## Quick orientation

| Piece                | Role                                                                          |
| -------------------- | ----------------------------------------------------------------------------- |
| `src/app/`           | App Router: pages, layouts, loading/error boundaries, Route Handlers (`api/`) |
| `src/modules/`       | Feature UI + services, split by `admin/`, `auth/`, `customer/`                |
| `src/components/ui/` | Reusable **shadcn/ui** primitives                                             |
| `src/shared/`        | Cross-cutting layout, providers, marketing blocks, shared hooks               |
| `src/store/`         | **Zustand** stores (auth, cart, wishlist, checkout, recently viewed)          |
| `src/lib/`           | Auth helpers, Nest mappers, API utilities, cart/wishlist sync                 |
| `src/services/api/`  | Axios client with token refresh                                               |
| `src/config/`        | `site.ts` — brand name, description, URL, locale                              |
| `src/constants/`     | `routes.ts`, `query-keys.ts`                                                  |
| `src/types/`         | Shared `ApiResponse`, entity re-exports                                       |
| `src/middleware.ts`  | JWT cookie guards, admin route protection, legacy `/admin` redirects          |
| `components.json`    | **shadcn** CLI config (required for `npx shadcn add`)                         |

---

## Architecture overview

```
Browser
  → Next.js page (Server or Client Component)
    → module component / service (axios)
      → /api/v1/* Route Handler (server)
        → NestJS backend (port 3001)
```

**Patterns in use:**

- **BFF (Backend-for-Frontend):** Browser never calls Nest directly; Route Handlers forward cookies and normalize responses.
- **Feature modules:** `modules/admin`, `modules/customer`, `modules/auth` each own components, services, types, and sometimes schemas.
- **Role-aware shared routes:** `/products`, `/dashboard`, `/orders` serve admin or customer UI based on JWT role from cookies.
- **Client state:** Zustand for cart, wishlist, auth UI, checkout wizard; TanStack Query for server-fetched lists and details.
- **Thin server pages:** `page.tsx` files fetch or branch on role, then delegate to `"use client"` module components for interactivity.

---

## Folder structure (`src/`)

```
src/
├── app/                          # App Router
│   ├── layout.tsx                # Root layout + AppProviders
│   ├── globals.css               # Tailwind v4 + shadcn tokens
│   ├── favicon.ico, icon.tsx, apple-icon.tsx, not-found.tsx
│   ├── (marketing)/              # Public landing
│   ├── (auth)/                   # Login, register, password reset
│   ├── (customer)/               # Cart, checkout, wishlist, profile, PDP
│   ├── (admin)/                  # Categories, product CRUD, users (no /admin URL prefix)
│   ├── (shared)/                 # Role-aware: products list, dashboard, orders
│   └── api/v1/                   # BFF Route Handlers
├── components/ui/                # shadcn primitives
├── config/site.ts
├── constants/routes.ts, query-keys.ts
├── hooks/use-debounced-value.ts
├── lib/                          # Auth, mappers, API helpers (see § Lib)
├── middleware.ts
├── modules/admin|auth|customer/  # Feature modules (see § Modules)
├── services/api/client.ts        # Axios + refresh interceptor
├── shared/                       # Layout shells, providers, marketing
├── store/                        # Zustand stores
└── types/api.ts, entities.ts, index.ts
```

---

## Route groups and URLs

Parentheses in folder names are **route groups** — they organize files without appearing in the URL.

| Folder under `src/app/` | URL examples                                                      | Layout / shell                              |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| `(marketing)/`          | `/`                                                               | `SiteShell` — marketing header/footer       |
| `(auth)/`               | `/login`, `/register`, `/forgot-password`, `/reset-password`      | `SiteShell` + centered card                 |
| `(customer)/`           | `/cart`, `/checkout`, `/wishlist`, `/profile`, `/products/[slug]` | `ShopRoleShell` → `CustomerAppShell`        |
| `(admin)/`              | `/categories`, `/products/new`, `/products/edit/[id]`, `/users`   | `ShopRoleShell` → `AdminAppShell`           |
| `(shared)/`             | `/products`, `/dashboard`, `/orders`, `/orders/[id]`              | `ShopRoleShell` — admin vs customer by role |

Canonical paths live in `src/constants/routes.ts`. Middleware redirects legacy `/admin/*` to these paths.

---

## Middleware (`src/middleware.ts`)

**Matcher:** all paths except `api`, `_next/static`, `_next/image`, `favicon.ico`.

| Step                 | Behavior                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Legacy redirect      | `/admin` and `/admin/*` → canonical paths (e.g. `/dashboard`, `/users`)                                                         |
| Public-only paths    | `/`, `/login`, `/register`, `/forgot-password`, `/reset-password` — redirect authenticated users to return path or `/dashboard` |
| Protected shop paths | Require valid JWT access cookie; else redirect to `/login?next=...`                                                             |
| Blocked users        | Clear cookies, redirect to `/login?blocked=1`                                                                                   |
| Admin-only paths     | `/users`, `/products/new`, `/products/edit/*` — non-admins → `/dashboard`                                                       |
| Return path cookie   | Sets `shop_return_path` on successful protected access                                                                          |

Uses: `verifyToken` (`lib/server-auth.ts`), `isProtectedShopPath` / `safeProtectedRedirectPath` (`lib/auth-route-guards.ts`), cookie constants (`lib/auth-cookies.ts`).

---

## Rendering modes (SSG, SSR, ISR, dynamic)

Per-route behavior in the App Router:

### Static (SSG) — `○` in build output

| Route                                                        | File                            | Notes                              |
| ------------------------------------------------------------ | ------------------------------- | ---------------------------------- |
| `/`                                                          | `(marketing)/page.tsx`          | Marketing home                     |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | `(auth)/*/page.tsx`             | Auth forms                         |
| `/cart`, `/checkout`, `/wishlist`                            | `(customer)/*/page.tsx`         | Client-heavy; page shell is static |
| `/categories`, `/categories/new`                             | `(admin)/categories/*/page.tsx` | Admin category list/create         |
| `/products/new`                                              | `(admin)/products/new/page.tsx` | Admin product create               |
| `/users`                                                     | `(admin)/users/page.tsx`        | Admin user list                    |

### ISR (Incremental Static Regeneration)

| Route              | File                                  | Config                                                                                         |
| ------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `/products/[slug]` | `(customer)/products/[slug]/page.tsx` | `export const revalidate = 60` — product PDP revalidates every 60s; `generateMetadata` for SEO |

No `generateStaticParams` — PDPs are generated on first request, then cached with ISR.

### Dynamic SSR — `ƒ` in build output

| Route                     | File                                  | Why dynamic                                                                     |
| ------------------------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| `/products`               | `(shared)/products/page.tsx`          | `getAccessTokenPayload()` uses `cookies()` — admin inventory vs customer browse |
| `/dashboard`              | `(shared)/dashboard/page.tsx`         | Layout `force-dynamic` + role branch                                            |
| `/profile`                | `(customer)/profile/page.tsx`         | Layout `force-dynamic`                                                          |
| `/orders`, `/orders/[id]` | `(shared)/orders/*/page.tsx`          | Session + role branching                                                        |
| `/users/[id]`             | `(admin)/users/[id]/page.tsx`         | Dynamic `[id]` segment                                                          |
| `/categories/[id]`        | `(admin)/categories/[id]/page.tsx`    | Client page with TanStack Query                                                 |
| `/products/edit/[id]`     | `(admin)/products/edit/[id]/page.tsx` | Client page with TanStack Query                                                 |

**Explicit exports:**

- `export const revalidate = 60` — only on `/products/[slug]`
- `export const dynamic = "force-dynamic"` — `(customer)/profile/layout.tsx`, `(shared)/dashboard/layout.tsx`
- `generateMetadata` — `/products/[slug]`, `/orders/[id]`, `/users/[id]`

---

## Server vs client components

**Rule:** A file is a **Server Component** unless it starts with `"use client"`.

### Server components (typical)

| File                                                                  | Purpose                                            |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------- |
| `app/layout.tsx`                                                      | Root HTML, metadata, `AppProviders` wrapper        |
| `(marketing                                                           | auth)/\*\*/layout.tsx`, `page.tsx`                 | Static shells and composition |
| `(shared)/products/page.tsx`, `dashboard/page.tsx`, `orders/page.tsx` | Role branching via `getAccessTokenPayload()`       |
| `(customer)/products/[slug]/page.tsx`                                 | Server fetch + pass product to `ProductDetailView` |
| `app/api/v1/**/route.ts`                                              | Route Handlers (always server)                     |
| `icon.tsx`, `apple-icon.tsx`                                          | Dynamic favicon generation                         |

### Client components (`"use client"`)

| Area                                | Files                                                                                      | Why client                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------- | ------------------- | ----------------------------------- |
| Layout shells                       | `shop-role-shell`, `customer-app-shell`, `admin-app-shell`, `site-header`, `site-footer`   | Auth store, pathname, navigation |
| Route group layouts                 | `(customer                                                                                 | admin                            | shared)/layout.tsx` | `ShopRoleShell` + Zustand hydration |
| Error boundaries                    | `**/error.tsx` (5 route groups)                                                            | React error boundary API         |
| Admin edit pages                    | `categories/[id]/page.tsx`, `products/edit/[id]/page.tsx`                                  | TanStack Query + forms           |
| All `modules/**` feature components | Lists, forms, checkout wizard, Stripe                                                      | Hooks, events, Query, Zustand    |
| UI (interactive)                    | `form`, `select`, `dropdown-menu`, `alert-dialog`, `pagination`, `tabs`, `table`, `sonner` | Radix / form libraries           |
| Providers                           | `app-providers`, `blocked-session-guard`                                                   | QueryClient, theme, toasts       |

**Pattern:** Keep `page.tsx` thin on the server; import a client module for interactivity (e.g. PDP passes server-fetched `product` into `ProductDetailView`).

---

## BFF API routes (`src/app/api/v1/`)

All handlers: validate session where needed → forward to Nest via `getBackendUrl()` + `forwardAuthorization()` → map response.

### Auth — `/api/v1/auth/`

| Route             | Methods | Purpose                      |
| ----------------- | ------- | ---------------------------- |
| `login`           | POST    | Login, set HTTP-only cookies |
| `logout`          | POST    | Clear cookies                |
| `register`        | POST    | Create account               |
| `refresh`         | POST    | Refresh access token         |
| `session`         | GET     | Current session payload      |
| `forgot-password` | POST    | Request reset email          |
| `reset-password`  | POST    | Complete password reset      |

### Admin — `/api/v1/admin/`

| Route                                                               | Methods                  | Purpose                                   |
| ------------------------------------------------------------------- | ------------------------ | ----------------------------------------- |
| `analytics`                                                         | GET                      | Admin dashboard metrics                   |
| `categories`, `categories/[id]`, `categories/[id]/restore`          | GET, POST, PATCH, DELETE | Category CRUD + soft-delete restore       |
| `products`, `products/[id]`, `products/[id]/restore`                | GET, POST, PATCH, DELETE | Product CRUD + restore                    |
| `orders`, `orders/[id]`, `orders/[id]/status`, `orders/[id]/cancel` | GET, PATCH, POST         | Order list, detail, status update, cancel |
| `users`, `users/[id]`, `users/[id]/detail`, `users/[id]/block`      | GET, PATCH               | User list, detail, block/unblock          |

### Customer — `/api/v1/customer/`

| Route                                                      | Methods                  | Purpose                          |
| ---------------------------------------------------------- | ------------------------ | -------------------------------- |
| `dashboard`                                                | GET                      | Customer dashboard stats         |
| `cart`, `cart/sync`, `cart/items/[variantId]`              | GET, POST, PATCH, DELETE | Cart CRUD + server sync          |
| `products`, `products/[slug]`                              | GET                      | Product list + PDP data          |
| `wishlist`, `wishlist/sync`, `wishlist/toggle/[productId]` | GET, POST                | Wishlist sync + toggle           |
| `orders`, `orders/[id]`, `orders/[id]/cancel`              | GET, POST                | Order history + cancel           |
| `orders/checkout`, `checkout/complete`, `checkout/cancel`  | POST                     | Stripe checkout flow             |
| `profile/me`, `profile/me/password`, `profile/me/avatar`   | GET, PATCH, POST         | Profile, password, avatar upload |

---

## Feature modules (`src/modules/`)

### `modules/auth/`

| File                                  | Usage                  |
| ------------------------------------- | ---------------------- |
| `components/login-form.tsx`           | Login page form        |
| `components/register-form.tsx`        | Register page form     |
| `components/forgot-password-form.tsx` | Forgot password        |
| `components/reset-password-form.tsx`  | Reset with token       |
| `services/auth.service.ts`            | Calls `/api/v1/auth/*` |
| `schemas/index.ts`                    | Zod schemas for forms  |
| `types.ts`                            | `User`, `UserRole`     |

### `modules/admin/`

| Submodule     | Components                                                                      | Service                 | Notes                  |
| ------------- | ------------------------------------------------------------------------------- | ----------------------- | ---------------------- |
| `categories/` | `admin-categories-list`, `admin-category-form`                                  | `categories.service.ts` | CRUD + restore         |
| `dashboard/`  | `admin-analytics`                                                               | `analytics.service.ts`  | Charts, KPIs           |
| `orders/`     | `admin-orders-list`, `admin-order-detail`                                       | `orders.service.ts`     | Status updates, cancel |
| `products/`   | `admin-products-list`, `admin-product-create-form`, `admin-product-update-form` | `products.service.ts`   | Image upload, variants |
| `users/`      | `admin-users-list`, `admin-user-detail`                                         | `users.service.ts`      | Block, order history   |
| `shared/`     | `admin-table-skeleton`, `admin-filter-toolbar-skeleton`                         | —                       | Loading UI             |

### `modules/customer/`

| Submodule    | Components                                                                                                            | Service                | Notes                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------- |
| `cart/`      | `cart-page-view`                                                                                                      | `cart.service.ts`      | Line items, sync        |
| `checkout/`  | `checkout-wizard`, `stripe-checkout-provider`, `stripe-payment-form`, `payment-continue-button`, `place-order-button` | `checkout.service.ts`  | Multi-step + Stripe     |
| `dashboard/` | `dashboard-overview`                                                                                                  | `dashboard.service.ts` | Spending, recent orders |
| `orders/`    | `orders-list`, `order-detail-view`, `order-status-badges`                                                             | `orders.service.ts`    | Cancel, status badges   |
| `products/`  | `products-page-content`, `product-listing`, `product-filters`, `product-card`, `product-detail-view`                  | `products.service.ts`  | Filters, PDP, variants  |
| `profile/`   | `profile-form`                                                                                                        | `profile.service.ts`   | Avatar, password        |
| `wishlist/`  | `wishlist-grid`                                                                                                       | `wishlist.service.ts`  | Toggle, sync            |

---

## Zustand stores (`src/store/`)

| Store                      | Persisted            | Purpose                                           |
| -------------------------- | -------------------- | ------------------------------------------------- |
| `auth-store.ts`            | Yes (`auth-storage`) | User, access token, expiry; `isTokenExpired()`    |
| `cart-store.ts`            | Yes                  | Cart line items (variantId, qty, maxQty)          |
| `wishlist-store.ts`        | Yes                  | Product ID list                                   |
| `checkout-store.ts`        | No                   | Wizard step, shipping address, Stripe session IDs |
| `recently-viewed-store.ts` | Yes                  | Last 10 product slugs                             |

Hydration: `shared/hooks/use-cart-hydrate.ts` and `use-wishlist-hydrate.ts` sync local store with server after login.

---

## Lib utilities (`src/lib/`)

| File                                                | Usage                                               |
| --------------------------------------------------- | --------------------------------------------------- |
| `server-auth.ts`                                    | JWT verify/sign for middleware and server pages     |
| `session-cookie.ts`                                 | Read access token payload from cookies (server)     |
| `require-auth.ts`                                   | Route Handler auth guard helper                     |
| `auth-cookies.ts`                                   | Cookie name constants                               |
| `auth-token-durations.ts`                           | Token TTL helpers                                   |
| `auth-route-guards.ts`                              | Protected path lists, safe redirect paths           |
| `account-blocked.ts`                                | Blocked-account detection                           |
| `backend-url.ts`                                    | Nest API base URL from env                          |
| `nest-http.ts`                                      | Server-side fetch to Nest with auth forward         |
| `nest-product-mapper.ts`                            | Nest product → client `Product`                     |
| `nest-catalog-mapper.ts`                            | Catalog list mapping                                |
| `nest-cart-mapper.ts`                               | Cart item mapping                                   |
| `nest-order-mapper.ts`                              | Nest order → client `Order`                         |
| `nest-user-mapper.ts`                               | User mapping                                        |
| `api-response.ts`                                   | Unwrap `{ data }` responses                         |
| `api-error.ts`                                      | `getApiErrorMessage()`, `isAccountBlockedMessage()` |
| `cart-actions.ts`, `wishlist-actions.ts`            | Optimistic store updates                            |
| `cart-wishlist-session.ts`, `cart-wishlist-sync.ts` | Guest → logged-in sync                              |
| `resolve-upload-url.ts`                             | Prefix backend URL on upload paths                  |
| `format-date.ts`                                    | Date formatting                                     |
| `slugify.ts`                                        | URL slug helper                                     |
| `utils.ts`                                          | `cn()` — clsx + tailwind-merge                      |

---

## Shared components (`src/shared/`)

| File                                                   | Usage                                            |
| ------------------------------------------------------ | ------------------------------------------------ |
| `components/providers/app-providers.tsx`               | QueryClient, ThemeProvider, Sonner               |
| `components/providers/blocked-session-guard.tsx`       | Redirect blocked users client-side               |
| `components/layout/site-shell.tsx`                     | Marketing/auth outer shell                       |
| `components/layout/site-header.tsx`, `site-footer.tsx` | Public nav                                       |
| `components/layout/shop-role-shell.tsx`                | Picks admin vs customer shell after auth hydrate |
| `components/layout/customer-app-shell.tsx`             | Customer sidebar + header                        |
| `components/layout/admin-app-shell.tsx`                | Admin sidebar + header                           |
| `components/layout/app-chrome-header.tsx`              | Shared page title area                           |
| `components/marketing/hero.tsx`                        | Home hero section                                |
| `components/feedback/empty-state.tsx`                  | Empty list placeholder                           |
| `hooks/use-app-section-meta.ts`                        | Page title/description for shells                |
| `hooks/use-cart-hydrate.ts`, `use-wishlist-hydrate.ts` | Post-login sync                                  |

---

## State and data flow

| Concern                | Implementation                                               |
| ---------------------- | ------------------------------------------------------------ | ------------------------- |
| Auth session (browser) | `auth-store` + `/api/v1/auth/*` + HTTP-only cookies          |
| Auth session (server)  | `getAccessTokenPayload()` / `requireAuth()` from cookies     |
| Cart / wishlist        | Zustand + `/api/v1/customer/cart                             | wishlist` + sync on login |
| Catalog / orders       | TanStack Query via module services → BFF → Nest              |
| Checkout               | `checkout-store` + Stripe Elements + checkout Route Handlers |
| Query cache keys       | `constants/query-keys.ts`                                    |

---

## `components.json` (shadcn)

Configuration for the **[shadcn/ui](https://ui.shadcn.com)** CLI (`npx shadcn add …`):

- Style preset: `base-nova`
- RSC enabled, TSX, Tailwind v4 via `src/app/globals.css`
- Import aliases: `@/components`, `@/components/ui`, `@/lib/utils`

Not a runtime dependency; required for future CLI component adds.

---

## App Router special files

| File            | Purpose                                      |
| --------------- | -------------------------------------------- |
| `layout.tsx`    | Shared UI wrapper for a segment and children |
| `page.tsx`      | Route UI                                     |
| `loading.tsx`   | Suspense loading UI                          |
| `error.tsx`     | Error boundary (client)                      |
| `not-found.tsx` | Local 404 UI                                 |

Present in: `(marketing)`, `(auth)`, `(customer)`, `(admin)`, `(shared)`.

---

## Styling

- **Tailwind CSS v4** via PostCSS (`postcss.config.mjs`)
- Design tokens and shadcn variables in `src/app/globals.css`
- **`cn()`** in `src/lib/utils.ts`

---

## Environment

See `.env.example`. Key variables:

| Variable                             | Purpose                                    |
| ------------------------------------ | ------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`               | Metadata, absolute URLs (`config/site.ts`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Elements                            |
| `BACKEND_URL`                        | Nest API (Route Handlers, server fetch)    |

---

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # production server
npm run lint     # ESLint
npm run format   # Prettier
```

---

## Request flow (end-to-end example)

**Product detail page (`/products/teapot`):**

1. Middleware allows public PDP (not in protected list).
2. Server `page.tsx` runs with `revalidate = 60`, fetches product via `fetchProductBySlug`.
3. Server renders `ProductDetailView` with product prop.
4. Client hydrates: variant pickers, add-to-cart (Zustand), wishlist toggle, recently viewed.

**Checkout:**

1. Middleware requires auth on `/checkout`.
2. `checkout-wizard` collects shipping → `createCheckout` → Stripe payment → `completeCheckout`.
3. BFF forwards to Nest `orders/checkout` endpoints; Nest handles stock, order creation, email.
