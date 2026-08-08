# client/AGENTS.md — Frontend AI Instructions

Frontend-only rules for the Next.js client. Global rules: [../AGENTS.md](../AGENTS.md).

**Detailed architecture:** [walkthrough.md](./walkthrough.md) — read the relevant section; do not assume this file replaces it.

## Stack

- Next.js 15 App Router under `src/`
- React 19, TypeScript, Tailwind CSS v4, shadcn/ui (`base-nova`)
- TanStack Query (server lists/details), Zustand (auth UI, cart, wishlist, checkout, recently viewed)
- Axios → Next BFF `/api/v1/*` only (not Nest JSON APIs)
- Forms: react-hook-form + Zod
- Auth: custom JWT cookies (`jose`) — **not** Clerk
- Brand config: `src/config/site.ts` (“Atelier Commerce”)

## Architecture (must preserve)

```text
Browser / SSR → axios /api/v1/... → Route Handler (BFF) → Nest (BACKEND_URL)
```

- JSON/auth traffic uses the BFF — do not point Axios at Nest
- Axios `baseURL`: browser = same-origin `""`; SSR = `getSiteUrl()` (this Next app), so server-side module calls still hit Route Handlers
- BFF validates session where needed, forwards Nest bearer (`Authorization` or `backend_access_token` cookie), unwraps Nest `{ data, version }`, maps via `src/lib/nest-*-mapper.ts`, and returns client `ApiResponse` `{ data, meta? }` (**no `version` field** on the BFF response type)
- Public image URLs may resolve to Nest `/uploads/**` (`resolveUploadUrl` / `next.config.ts` remotePatterns) — not a substitute for BFF APIs; never use public `/uploads` for private docs
- Feature UI lives in `src/modules/{admin|auth|customer|seller}/`
- Thin `page.tsx`: role branch or fetch, then delegate to `"use client"` modules
- Role-shared routes (`/dashboard`, `/products`, `/orders`, `/payments`, `/reviews`) pick UI from session role
- Product create/edit pages live under `(admin)` route group for layout reuse but call **seller** modules and `/api/v1/seller/products/*` — **no** `/api/v1/admin/products/*` on disk

## Key paths

| Path | Role |
|------|------|
| `src/app/(marketing\|auth\|customer\|admin\|shared)/` | Route groups (parentheses not in URL) |
| `src/app/api/v1/{auth\|admin\|customer\|seller}/` | BFF Route Handlers |
| `src/modules/` | Feature components, services, schemas, types |
| `src/components/ui/` | shadcn primitives only |
| `src/shared/` | Shells, providers, marketing, marketplace UI, nav |
| `src/store/` | Zustand stores |
| `src/lib/` | Auth, BFF helpers, Nest mappers |
| `src/services/api/client.ts` | Axios + refresh interceptor |
| `src/constants/routes.ts`, `query-keys.ts` | Canonical routes / Query keys |
| `src/middleware.ts` | JWT guards, role paths, legacy `/admin` redirects |

## Conventions

### Routing & authz

- Canonical paths: `src/constants/routes.ts`
- Middleware + `lib/auth-route-guards.ts` / `lib/require-auth.ts`
- BFF guards: `requireUser`, `requireAdmin` (**means `SUPER_ADMIN`**), `requireSuperAdmin` (alias of `requireAdmin`), `requireSeller`
- Admin URLs are **not** under `/admin` (legacy `/admin/*` redirected)
- Seller product paths require `SELLER`; admin moderation requires `SUPER_ADMIN`

### Components & modules

- Server Component by default; `"use client"` only when needed
- Feature UI under `modules/<area>/<feature>/` with `components/`, `services/`, `schemas/`, `types`, optional `hooks/`, `utils/`
- Prefer existing shared shells (`shared/*-app-shell`, `shop-role-shell`) and marketplace feedback components

### Data & state

- Lists/details: TanStack Query via module `*.service.ts` → `/api/v1/...`
- Cart/wishlist/auth user: Zustand (+ hydrate/sync helpers in `lib/` and `shared/hooks/`)
- Query defaults: see `constants/query-keys.ts` and `shared/providers`

### BFF Route Handlers

Typical pattern: guard → `getBackendUrl()` + `forwardAuthorization()` → Nest → mapper → `jsonOk` / `jsonMessage`. Mirror an existing handler in the same role folder.

### Validation & errors

- Client forms: Zod schemas colocated in the feature
- BFF: Zod (or equivalent) on incoming bodies where existing routes do
- Errors: `lib/api-error.ts`, `nestErrorMessage`, Sonner toasts in UI

### Naming

- Files: kebab-case (`seller-products-list.tsx`, `products.service.ts`)
- Prefer existing export style from feature `index.ts`

### Testing

- Vitest: `src/**/*.test.ts(x)` — coverage is currently thin; add/update tests near changed logic when appropriate
- Scripts: `npm run lint`, `npm run test`, `npm run build`

## Before Creating a New Feature

1. Find the closest existing feature under `src/modules/`
2. Inspect its folder structure, page entry, and BFF routes
3. Identify reusable components / hooks / utilities / mappers
4. Identify the existing API/BFF pattern for that role
5. Follow that pattern instead of inventing a new one
6. Modify only the required files

**Frontend reference implementation:** `src/modules/seller/products` (+ matching `src/app/api/v1/seller/products*`). See [../docs/ai-development.md](../docs/ai-development.md).

## Walkthrough map (load only what you need)

| Topic | Walkthrough section |
|-------|---------------------|
| Route groups / URLs | Route groups and page URLs |
| Middleware / roles | Middleware; Auth / session |
| BFF catalog | BFF API routes |
| Modules | Feature modules |
| Zustand / Query | Zustand stores; State and data flow |
| Env | Environment |

## Do not

- Add `/api/v1/admin/products/*` (catalog mutations stay on seller BFF)
- Point browser/SSR Axios at Nest for business APIs (use `/api/v1/*`)
- Put domain business rules in Route Handlers beyond auth, validation, forward, and mapping
- Redesign shells, auth cookies, or role chrome without an explicit request
- Expose private seller/customer documents via public `/uploads` URLs
