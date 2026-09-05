# Atelier Commerce — Client Walkthrough

> AI agents: follow [`AGENTS.md`](./AGENTS.md) for frontend rules and [`../AGENTS.md`](../AGENTS.md) for global rules. Workflows/ADRs: [`../docs/ai-development.md`](../docs/ai-development.md).

This document describes the **Next.js 15** storefront under `client/`: folder layout, request flow, pages, BFF routes, and feature modules. Paths are relative to `client/` unless noted.

Stack: **Next.js 15.5** (App Router under `src/`), **React 19**, **TypeScript**, brand **“Atelier Commerce”**.

The client talks to a **NestJS backend** through a **BFF layer** (`src/app/api/v1/**`) that proxies requests, sets auth cookies, and maps Nest shapes to UI types. Browser/SSR **JSON and auth** traffic goes through the BFF (Axios does not call Nest APIs). Public image assets may still load from Nest `/uploads/**`; private files use secure file endpoints.

Auth is **custom JWT** (`jose` + Nest `/auth/*`) — not Clerk.

---

## Quick orientation

| Piece | Role |
|-------|------|
| `src/app/` | App Router: pages, layouts, loading/error, Route Handlers (`api/`) |
| `src/modules/` | Feature UI + services: `admin/`, `auth/`, `customer/`, `seller/` |
| `src/components/ui/` | Reusable **shadcn/ui** primitives |
| `src/shared/` | Layout shells, providers, marketing, marketplace UI, nav |
| `src/store/` | **Zustand** (auth, cart, wishlist, checkout, recently viewed) |
| `src/lib/` | Auth helpers, Nest mappers, API utilities, cart/wishlist sync |
| `src/services/api/` | Axios client with token refresh |
| `src/config/` | `site.ts` — brand, description, URL, locale |
| `src/constants/` | `routes.ts`, `query-keys.ts` |
| `src/types/` | Shared `ApiResponse`, entity re-exports |
| `src/middleware.ts` | JWT cookie guards, role paths, legacy `/admin` redirects |
| `components.json` | **shadcn** CLI config (`npx shadcn add`) |
| `vitest.config.ts` | Unit tests (`src/**/*.test.ts(x)`) |

---

## Architecture overview

```text
Browser
  → Next.js page (Server or Client Component)
    → module component / service (axios → /api/v1/…)
      → Route Handler (server)
        → NestJS backend (port 3001)
```

**Patterns in use:**

- **BFF:** Route Handlers forward cookies / Bearer, unwrap Nest `{ data, version }`, and return client `{ data }` (see `ApiResponse`; optional `meta`).
- **Feature modules:** each of `admin`, `customer`, `seller`, `auth` owns components, services, types, schemas.
- **Role-aware shared routes:** `/dashboard`, `/products`, `/orders`, `/payments`, `/reviews` pick UI from session role.
- **Client state:** Zustand for cart, wishlist, auth UI, checkout wizard; TanStack Query for server lists/details.
- **Thin server pages:** `page.tsx` branches on role or fetches data, then delegates to `"use client"` modules.
- **Product CRUD is seller-owned:** create/edit pages live under the `(admin)` route group for layout reuse, but call **seller** modules and `/api/v1/seller/products/*` (no admin product BFF).

---

## Folder structure (`src/`)

```text
src/
├── app/                          # App Router
│   ├── layout.tsx                # Root layout + AppProviders
│   ├── globals.css               # Tailwind v4 + shadcn tokens
│   ├── icon.tsx, apple-icon.tsx, not-found.tsx, global-error.tsx
│   ├── (marketing)/              # Public landing
│   ├── (auth)/                   # Login, register, password reset
│   ├── (customer)/               # Cart, checkout, wishlist, profile, PDP, seller apply
│   ├── (admin)/                  # Users, categories, seller-profiles, stores; product create/edit (seller UI)
│   ├── (shared)/                 # Role-aware: dashboard, products, orders, payments, store, reviews
│   └── api/v1/                   # BFF Route Handlers (~91 routes)
├── components/ui/                # shadcn primitives
├── config/site.ts
├── constants/routes.ts, query-keys.ts
├── lib/                          # Auth, mappers, API helpers
├── middleware.ts
├── modules/admin|auth|customer|seller/
├── services/api/client.ts        # Axios + refresh interceptor
├── shared/                       # Shells, providers, marketing, marketplace
├── store/                        # Zustand
└── types/
```

---

## Route groups and page URLs

Parentheses in folder names are **route groups** — they organize files without appearing in the URL. Canonical paths live in `src/constants/routes.ts`.

| Group | Layout / shell | Role |
|-------|----------------|------|
| `(marketing)` | `SiteShell` | Public landing |
| `(auth)` | `SiteShell` (centered card, no footer) | Login / register / password |
| `(customer)` | `ShopMountedShell` → buyer chrome | Shopping + profile + become-seller |
| `(admin)` | `ShopMountedShell` | Admin pages + seller product create/edit |
| `(shared)` | `ShopMountedShell` | Role-switching pages |

### Marketing — `(marketing)/`

| URL | Purpose |
|-----|---------|
| `/` | Landing hero (`Hero`) |

### Auth — `(auth)/`

| URL | Purpose |
|-----|---------|
| `/login` | Sign-in |
| `/register` | Registration |
| `/forgot-password` | Request reset email |
| `/reset-password` | Set new password (token query) |

### Customer — `(customer)/`

| URL | Purpose |
|-----|---------|
| `/cart` | Shopping cart |
| `/checkout` | Multi-step Stripe / COD checkout |
| `/checkout/success` | Post-payment success |
| `/wishlist` | Saved products |
| `/notifications` | In-app notifications |
| `/products/[slug]` | Public product detail (ISR `revalidate = 60`) |
| `/profile` | Account profile |
| `/profile/addresses` | Address book |
| `/become-seller` | Seller application + documents |

### Admin route group — `(admin)/`

URLs are **not** under `/admin`. Middleware redirects legacy `/admin/*` → these paths.

| URL | Purpose |
|-----|---------|
| `/users` | Admin user list |
| `/users/[id]` | Admin user detail / block |
| `/categories` | Category list |
| `/categories/new` | Create category |
| `/categories/[id]` | Edit category |
| `/seller-profiles` | Seller applications list |
| `/seller-profiles/[id]` | Application detail (approve / reject / suspend / unsuspend) |
| `/stores` | Admin store list (not public `/stores/[slug]`) |
| `/stores/manage/[id]` | Admin store detail (verify / suspend) |
| `/products/new` | **Seller** product create form |
| `/products/edit/[id]` | **Seller** product edit form |

### Shared — `(shared)/`

| URL | Purpose |
|-----|---------|
| `/dashboard` | Role dashboard: admin analytics / seller / buyer |
| `/products` | Catalog browse **or** seller product management |
| `/products/manage/[id]` | Seller product detail / manage (variants, publish, archive) |
| `/orders` | Orders list by role |
| `/orders/[id]` | Order detail by role |
| `/payments` | Payments list (admin / seller) |
| `/payments/[id]` | Payment detail (admin refunds; seller COD confirm/reject) |
| `/reviews` | Admin/seller reviews (buyers redirected to dashboard) |
| `/store` | Seller storefront settings |
| `/stores/[slug]` | Public store page (ISR `revalidate = 60`) |

Also under `app/`: per-group `loading.tsx` / `error.tsx` / `not-found.tsx` where present; extra errors under `(shared)/products`, `products/manage`, and `stores`.

---

## Middleware (`src/middleware.ts`)

**Matcher:** all paths except `api`, `_next/static`, `_next/image`, `favicon.ico`.

Helpers: `lib/auth-route-guards.ts`, `lib/server-auth.ts`, `lib/auth-cookies.ts`, role utils in `modules/auth/utils/roles.ts`.

| Step | Behavior |
|------|----------|
| Legacy redirect | `/admin` → `/dashboard`; `/admin/*` → strip `/admin` prefix |
| Public-only | `/`, `/login`, `/register`, `/forgot-password`, `/reset-password` — authenticated users → return path or `/dashboard` |
| Public catalog | `/products` (except manage/edit/new), `/stores/[slug]`, `/products/[slug]` — no auth required |
| Protected shop | Require valid session JWT; else `/login?next=…` |
| Blocked users | Clear cookies → `/login?blocked=1` |
| Admin-only | `/users`, `/categories`, `/seller-profiles`, `/stores` (exact), `/stores/manage/*` → `SUPER_ADMIN` |
| Seller product paths | `/products/new`, `/products/edit/*`, `/products/manage/*` → `SELLER` |
| Seller store settings | `/store` → `SELLER` |
| Return path | Sets `shop_return_path` on protected navigations |

**Protected prefixes include:** dashboard, profile, orders, payments, cart, checkout, wishlist, users, categories, notifications, reviews, become-seller, seller-profiles, product management, admin stores, seller `/store`.

---

## Auth / session

### Cookies (`lib/auth-cookies.ts`)

| Cookie | Role |
|--------|------|
| `access_token` | Next session JWT (`jose`, `JWT_SECRET`, `typ: "access"`) for middleware |
| `backend_access_token` | Nest access JWT forwarded by BFF |
| `refresh_token` | Nest refresh; used server-side on `/api/v1/auth/refresh` |

### Client state (`store/auth-store.ts`)

- Zustand + persist: **user only** in `localStorage` (`auth-storage`).
- Nest access token is **memory-only**; rehydrated via refresh after reload.
- Axios interceptor (`services/api/client.ts`): bootstrap/refresh on 401, shared refresh promise, blocked-account handling.

### Roles

`BUYER` | `SELLER` | `SUPER_ADMIN` (`modules/auth/utils/roles.ts`).

Also: `BlockedSessionGuard`, `shop_return_path` cookie, `/api/v1/auth/session` for session reads.

Chrome resolution (`shared/navigation/app-nav.ts`): super admin → admin portal; seller → seller portal (+ buyer cart/wishlist extras if also buyer); else buyer.

---

## Rendering modes

### Static (SSG) — typical

Marketing home, auth forms, and many client-heavy shells (`/cart`, `/checkout`, `/wishlist`, admin list/create pages) ship a static page shell with client interactivity.

### ISR

| Route | Config |
|-------|--------|
| `/products/[slug]` | `export const revalidate = 60` + `generateMetadata` |
| `/stores/[slug]` | `export const revalidate = 60` |

No `generateStaticParams` — generated on first request, then cached.

### Dynamic SSR

| Route | Why |
|-------|-----|
| `/products`, `/dashboard`, `/orders`, `/orders/[id]`, `/payments`, `/payments/[id]`, `/reviews`, `/store` | Session cookie + role branching |
| `/profile` | Layout `force-dynamic` |
| Dynamic `[id]` admin pages | Path params / Query |

---

## Server vs client components

**Rule:** A file is a **Server Component** unless it starts with `"use client"`.

| Kind | Examples |
|------|----------|
| Server | Root/group layouts that compose shells; shared pages that branch on `getAccessTokenPayload()`; PDP/store pages that fetch then pass props; all `app/api/**/route.ts` |
| Client | Shells (`shop-role-shell`, role app shells, header/footer); all `modules/**` feature UI; forms; TanStack Query pages; error boundaries; providers |

**Pattern:** Keep `page.tsx` thin; import a client module for interactivity.

---

## BFF API routes (`src/app/api/v1/`)

Pattern: validate session where needed → `getBackendUrl()` + `forwardAuthorization()` → Nest → map with `lib/nest-*-mapper.ts`.

Guards: `requireUser` / `requireAdmin` / `requireSeller` (`lib/require-auth.ts`).

**~91 Route Handlers** under auth / admin / customer / seller. There is **no** `/api/v1/admin/products/*`.

### Auth — `/api/v1/auth/`

| Route | Methods | Purpose |
|-------|---------|---------|
| `login` | POST | Login, set HTTP-only cookies |
| `logout` | POST | Clear cookies |
| `register` | POST | Create account |
| `refresh` | POST | Refresh access token |
| `session` | GET | Current session payload |
| `forgot-password` | POST | Request reset email |
| `reset-password` | POST | Complete password reset |

### Admin — `/api/v1/admin/`

| Route | Methods | Purpose |
|-------|---------|---------|
| `analytics` | GET | Admin dashboard metrics |
| `categories`, `categories/[id]`, `categories/[id]/restore` | GET, POST, PATCH, DELETE | Category CRUD + restore |
| `orders`, `orders/[id]`, `orders/[id]/status`, `orders/[id]/cancel` | GET, PATCH, POST | Orders |
| `payments`, `payments/[id]`, `payments/[id]/refunds` | GET, POST | Payments + admin refund record |
| `users`, `users/[id]`, `users/[id]/detail`, `users/[id]/block` | GET, PATCH | Users |
| `reviews`, `reviews/[id]` | GET, DELETE | Platform reviews + moderate delete |
| `seller-profiles`, `seller-profiles/[id]` | GET | Seller applications |
| `seller-profiles/[id]/approve`, `reject`, `suspend`, `unsuspend` | PATCH | Application decisions |
| `stores`, `stores/[id]` | GET | Store list / detail |
| `stores/[id]/verify`, `unverify`, `suspend`, `unsuspend` | PATCH | Store moderation |
| `files/secure/[fileId]` | GET | Proxy private Nest file stream (e.g. seller docs) |

### Customer — `/api/v1/customer/`

| Route | Methods | Purpose |
|-------|---------|---------|
| `dashboard` | GET | Customer dashboard stats |
| `categories` | GET | Catalog categories |
| `products`, `products/[slug]` | GET | Product list + PDP |
| `stores/[slug]` | GET | Public store |
| `cart`, `cart/sync`, `cart/items/[variantId]` | GET, POST, PATCH, DELETE | Cart CRUD + sync (+ clear via DELETE `cart`) |
| `wishlist`, `wishlist/sync`, `wishlist/toggle/[productId]` | GET, POST | Wishlist |
| `addresses`, `addresses/[id]`, `addresses/[id]/default` | GET, POST, PATCH, DELETE | Address book |
| `profile/me`, `profile/me/password`, `profile/me/avatar` | GET, PATCH, POST | Profile |
| `orders`, `orders/[id]`, `orders/[id]/cancel` | GET, POST | Order history |
| `orders/checkout`, `orders/checkout/complete`, `orders/checkout/cancel` | POST | Checkout flow |
| `notifications`, `notifications/unread-count`, `notifications/read-all`, `notifications/[id]/read` | GET, PATCH | Notifications |
| `reviews`, `reviews/[id]`, `reviews/product/[productId]`, `reviews/product/[productId]/summary`, `reviews/store/[storeId]/reputation` | GET, POST, PATCH, DELETE | Reviews |
| `seller-profile`, `seller-profile/me`, `seller-profile/me/documents` | GET, POST, PATCH | Become-seller |

### Seller — `/api/v1/seller/`

| Route | Methods | Purpose |
|-------|---------|---------|
| `dashboard` | GET | Seller analytics |
| `categories` | GET | Categories for product forms |
| `products`, `products/[id]` | GET, POST, PATCH, DELETE | Seller catalog |
| `products/[id]/publish`, `archive`, `restore` | PATCH | Lifecycle |
| `product-variants` | GET, POST | Variant list + create |
| `product-variants/[id]` | PATCH, DELETE | Variant update + delete |
| `orders`, `orders/[id]`, `orders/[id]/status` | GET, PATCH | Store orders |
| `payments`, `payments/[id]` | GET | Store payments |
| `payments/[id]/cod/confirm`, `payments/[id]/cod/reject` | POST | COD actions |
| `reviews` | GET | Reviews on seller products |
| `store/me`, `store/me/files`, `store/me/files/[type]` | GET, PATCH, POST, DELETE | Store + logo/banner |

---

## Feature modules (`src/modules/`)

### `modules/auth/`

| Area | Contents |
|------|----------|
| Components | `login-form`, `register-form`, `forgot-password-form`, `reset-password-form` |
| Services | `auth.service.ts` → `/api/v1/auth/*` |
| Schemas / types | Zod forms; `User`, `UserRole` |
| Hooks / utils | `use-roles`; `roles.ts` — `isBuyer`, `isSeller`, `isSuperAdmin` |

### `modules/admin/`

| Submodule | Components | Service | Notes |
|-----------|------------|---------|-------|
| `categories/` | list, form | `categories.service.ts` | CRUD + restore |
| `dashboard/` | `admin-analytics` (Recharts) | `analytics.service.ts` | KPIs |
| `orders/` | list, detail | `orders.service.ts` | Status, cancel |
| `payments/` | list, detail, badges, refund dialog | `payments.service.ts` | Admin refunds |
| `users/` | list, detail | `users.service.ts` | Block |
| `reviews/` | `admin-reviews-list` | `reviews.service.ts` | Platform reviews + delete |
| `seller-profiles/` | list, detail, approve/reject/suspend/unsuspend dialogs | seller-profiles service | Become-seller moderation |
| `stores/` | list, detail, suspend/confirm dialogs | `stores.service.ts` | Verify / suspend |
| `shared/` | table / filter skeletons | — | Loading UI |

### `modules/customer/`

| Submodule | Purpose |
|-----------|---------|
| `cart/` | Cart page view + service |
| `checkout/` | Wizard, Stripe Elements, COD, success |
| `dashboard/` | Buyer overview |
| `orders/` | List, detail, status badges |
| `products/` | Listing, filters, card, PDP |
| `profile/` | Profile form (avatar, password) |
| `addresses/` | Address manager |
| `wishlist/` | Wishlist grid |
| `notifications/` | Notification list + unread |
| `reviews/` | Product reviews section, rating distribution |
| `seller-registration/` | Become-seller view, application form, docs, status panels |
| `stores/` | Public store view + service |
| `discovery/` | Continue-shopping CTA used from the cart page |
| `shared/` | Store grouping helpers for cart/checkout |

### `modules/seller/`

| Submodule | Purpose |
|-----------|---------|
| `dashboard/` | Seller dashboard |
| `products/` | List, create, edit, detail, variants, status badge |
| `orders/` | Seller orders list + detail |
| `payments/` | Payments list/detail + COD confirm/reject dialogs |
| `store/` | Store page, edit form, image upload |
| `reviews/` | Seller reviews list |

---

## Zustand stores (`src/store/`)

| Store | Persisted | Purpose |
|-------|-----------|---------|
| `auth-store.ts` | Yes (`auth-storage`) — user only | User; access token memory-only |
| `cart-store.ts` | Yes | Line items (variantId, qty, maxQty) |
| `wishlist-store.ts` | Yes | Product ID list |
| `checkout-store.ts` | No | Wizard step, shipping, Stripe session IDs |
| `recently-viewed-store.ts` | Yes | Last product slugs |

Hydration: `shared/hooks/use-cart-hydrate.ts` and `use-wishlist-hydrate.ts` sync local store with server after login.

---

## Lib utilities (`src/lib/`)

### Auth

| File | Usage |
|------|-------|
| `server-auth.ts` | JWT verify/sign for middleware and server pages |
| `session-cookie.ts` | Read access token payload from cookies |
| `require-auth.ts` | Route Handler auth guards |
| `auth-cookies.ts` | Cookie name constants |
| `auth-token-durations.ts` | Token TTL helpers |
| `auth-route-guards.ts` | Protected / admin / seller path lists |
| `account-blocked.ts` | Blocked-account detection |

### BFF / Nest

| File | Usage |
|------|-------|
| `backend-url.ts` | Nest base URL from env |
| `nest-http.ts` | Server-side fetch to Nest with auth forward |
| `api-response.ts` | Unwrap `{ data }` |
| `api-error.ts` | `getApiErrorMessage()`, blocked-message helpers |

### Mappers

| File | Maps |
|------|------|
| `nest-product-mapper.ts` | Product |
| `nest-seller-product-mapper.ts` | Seller product |
| `nest-seller-variant-mapper.ts` | Variants |
| `nest-cart-mapper.ts` | Cart |
| `nest-order-mapper.ts` | Orders |
| `nest-payment-mapper.ts` | Payments |
| `nest-user-mapper.ts` | Users |
| `nest-store-mapper.ts` | Stores |
| `nest-seller-profile-mapper.ts` | Seller profiles |
| `nest-address-mapper.ts` | Addresses |
| `nest-review-mapper.ts` | Reviews |

### Cart / wishlist / misc

| File | Usage |
|------|-------|
| `cart-actions.ts`, `wishlist-actions.ts` | Optimistic store updates |
| `cart-wishlist-session.ts`, `cart-wishlist-sync.ts` | Guest → logged-in sync |
| `resolve-upload-url.ts` | Prefix backend URL on upload paths |
| `format-date.ts`, `slugify.ts`, `utils.ts` (`cn`) | Helpers |

---

## Shared components (`src/shared/`)

### Layout / chrome

| File | Usage |
|------|-------|
| `site-shell.tsx` | Marketing / auth outer shell |
| `site-header.tsx`, `site-footer.tsx` | Public nav |
| `shop-mounted-shell.tsx` | Client mount gate for shop layouts |
| `shop-role-shell.tsx` | Picks admin / seller / buyer shell after auth hydrate |
| `role-app-shell.tsx` | Shared role chrome helper |
| `admin-app-shell.tsx` | Admin sidebar + header |
| `seller-app-shell.tsx` | Seller sidebar + header |
| `customer-app-shell.tsx` | Buyer sidebar + header |
| `app-chrome-header.tsx` | Shared page title area |

### Nav

`shared/navigation/app-nav.ts` — chrome menus by role:

- **Admin:** dashboard, users, seller applications, categories, stores, orders, payments, reviews, notifications
- **Seller:** dashboard, store, products, orders, payments, reviews, notifications, profile (+ cart/wishlist if also buyer)
- **Buyer:** dashboard, products, cart, wishlist, orders, notifications, addresses, become-seller, profile

### Providers / feedback / marketplace

| File | Usage |
|------|-------|
| `providers/app-providers.tsx` | QueryClient, ThemeProvider, Sonner |
| `providers/blocked-session-guard.tsx` | Client redirect for blocked users |
| `marketing/hero.tsx` | Home hero |
| `feedback/empty-state.tsx`, `route-error.tsx` | Empty / error UI |
| `marketplace/*` | Rating stars, review card, notification card, verified badge, error view |

### Hooks

`use-app-section-meta`, `use-cart-hydrate`, `use-wishlist-hydrate`, `use-debounced-value`, `use-product-image-previews`.

---

## State and data flow

| Concern | Implementation |
|---------|----------------|
| Auth (browser) | `auth-store` + `/api/v1/auth/*` + HTTP-only cookies |
| Auth (server) | `getAccessTokenPayload()` / `requireAuth()` from cookies |
| Cart / wishlist | Zustand + customer BFF + sync on login |
| Catalog / orders / payments / reviews | TanStack Query via module services → BFF → Nest |
| Checkout | `checkout-store` + Stripe Elements + checkout Route Handlers |
| Query keys | `constants/query-keys.ts` (stale ~60s, retry 1, no refetchOnFocus by default) |

Forms: **react-hook-form + zod**. HTTP: **Axios** to same-origin `/api/v1`.

---

## UI / styling

- **Tailwind CSS v4** + `tw-animate-css` + shadcn tokens in `globals.css`
- **shadcn** style `base-nova`, baseColor `neutral`, CSS variables, **lucide** icons
- Primitives: `@base-ui/react`, `@radix-ui/react-slot`, CVA, `clsx`, `tailwind-merge`
- **next-themes**, **sonner**, **framer-motion**, **recharts**
- Font: **Montserrat**
- Stripe: `@stripe/react-stripe-js`, `@stripe/stripe-js`

**`components/ui/`:** alert-dialog, badge, button, card, dropdown-menu, form, input, label, pagination, select, separator, skeleton, sonner, table, tabs, textarea.

---

## Environment

Key variables (see local `.env` / deployment config):

| Variable | Purpose |
|----------|---------|
| `BACKEND_URL` | Nest API for Route Handlers (prefer over public fallback) |
| `NEXT_PUBLIC_BACKEND_URL` | Fallback Nest URL for local/dev |
| `NEXT_PUBLIC_SITE_URL` | Metadata, absolute URLs (`config/site.ts`) |
| `NEXT_PUBLIC_API_URL` | Fallback site URL for SSR axios |
| `JWT_SECRET` | Sign/verify Next session JWT (≥32 chars in production) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Elements |
| `NEXT_PUBLIC_UPLOADS_HOST` | Image remote host (default `localhost`) |
| `NEXT_PUBLIC_UPLOADS_PROTOCOL` | `http` / `https` |
| `NEXT_PUBLIC_UPLOADS_PORT` | Default `3001` when host is localhost |

`next.config.ts` allows remote images from Picsum and Nest `/uploads/**`.

---

## Scripts

```bash
npm run dev         # development server (port 3000)
npm run build       # production build
npm run start       # production server
npm run lint        # ESLint
npm run format      # Prettier
npm run test        # Vitest (run once)
npm run test:watch  # Vitest watch
```

Current unit coverage is thin (e.g. `modules/customer/checkout/services/checkout.service.test.ts`).

---

## Request flow examples

### Product detail (`/products/teapot`)

1. Middleware allows public PDP.
2. Server `page.tsx` with `revalidate = 60` fetches via BFF / Nest.
3. Renders `ProductDetailView` with product prop.
4. Client hydrates: variants, add-to-cart (Zustand), wishlist, recently viewed, reviews.

### Become a seller (`/become-seller`)

1. Middleware requires auth.
2. `become-seller-view` loads `/api/v1/customer/seller-profile/me`.
3. Buyer submits application + documents → Nest `seller-profile` endpoints.
4. Admin reviews at `/seller-profiles` → BFF `PATCH .../approve|reject|suspend|unsuspend`.
5. On approve, Nest creates store + `SELLER` role + notification; client refreshes session so seller chrome unlocks.

### Admin store moderation (`/stores` → `/stores/manage/:id`)

1. Middleware requires `SUPER_ADMIN` (exact `/stores` / `/stores/manage/*`, not public slug pages).
2. List/detail via `/api/v1/admin/stores*`.
3. Verify / unverify / suspend / unsuspend via dedicated PATCH handlers.

### Checkout

1. Middleware requires auth on `/checkout`.
2. Wizard collects shipping → `createCheckout` → Stripe payment (or COD) → `completeCheckout`.
3. BFF forwards to Nest `orders/checkout*`; Nest handles stock, orders, email, notifications.

### Payments (`/payments`)

1. Shared page branches on role.
2. Admin: list/detail + refund dialog → `/api/v1/admin/payments*`.
3. Seller: list/detail + COD confirm/reject → `/api/v1/seller/payments*`.

### Role-shared products (`/products`)

1. Server page reads session cookie.
2. Renders seller list or customer catalog from the matching module (admins are not product editors).
