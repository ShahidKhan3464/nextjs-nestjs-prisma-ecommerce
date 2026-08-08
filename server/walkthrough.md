# Multi-Vendor E-Commerce — Server Walkthrough

> AI agents: follow [`AGENTS.md`](./AGENTS.md) for backend rules and [`../AGENTS.md`](../AGENTS.md) for global rules. Workflows/ADRs: [`../docs/ai-development.md`](../docs/ai-development.md).

NestJS API under `server/` (default port **3001**). PostgreSQL via **Prisma 7**. Paths below are relative to `server/` unless noted.

There is **no global URL prefix**. Controllers mount at root (`/auth`, `/products`, …). The Next.js BFF remaps these under `/api/v1/{role}/…`. Nest success envelopes use `API_VERSION` as `{ data, version }` only (the BFF unwraps this; client `ApiResponse` is `{ data, meta? }` without `version`).

Auth is **custom JWT** (`@nestjs/jwt` + bcrypt) — not Clerk. Roles: `BUYER` | `SELLER` | `SUPER_ADMIN`.

---

## Layout (`src/`)

```text
src/
├── modules/           # Business domains
├── integrations/      # mail, stripe, storage
├── common/            # guards, filters, pagination, crypto, swagger, utils
├── config/            # Env namespaces + Joi validation
├── prisma/            # PrismaModule / PrismaService
├── generated/prisma/  # Generated client (do not edit)
├── health/            # Liveness / readiness
├── seeders/           # Admin (+ optional demo seed, mostly commented)
├── main.ts
└── app.module.ts
```

**Typical domain module layout:**

```text
modules/<name>/
├── *.module.ts
├── *.controller.ts
├── *.service.ts          # Thin facade
├── providers/            # One use-case class per action
├── dto/
├── constants/
├── utils/
└── (optional) types/, pipes/, interceptors/, validators/
```

---

## Request flow

```text
HTTP
  → requestIdMiddleware / helmet / compression / CORS
  → ThrottlerGuard
  → AuthenticationGuard
  → RolesGuard
  → Controller
  → Service (facade)
  → Provider (use-case)
  → Prisma / MailService / StripeService / STORAGE_PROVIDER
```

Responses are wrapped by `DataResponseInterceptor` as `{ data, version }`.

---

## Domain modules

All live under `src/modules/` (plus `src/health/`):

| Module | Path | Purpose |
|--------|------|---------|
| **Auth** | `auth` | Register, login, forgot/reset password, refresh, logout |
| **Users** | `users` | Profile, password, avatar; admin list/detail/block |
| **Sellers** | `sellers` | Become-seller application, docs, admin approve/reject/suspend |
| **Stores** | `stores` | Seller store CRUD/files; admin list + suspend/verify |
| **Categories** | `categories` | Public catalog; admin CRUD + soft-delete/restore |
| **Products** | `products` | Catalog, slug detail, seller catalog, publish/archive/soft-delete |
| **Product variants** | `product-variants` | SKU / size / color / stock / price |
| **Carts** | `carts` | Authenticated cart + guest sync |
| **Wishlists** | `wishlists` | Wishlist + sync + toggle |
| **Addresses** | `addresses` | Saved shipping/billing addresses |
| **Orders** | `orders` | Checkout (Stripe/COD), complete/cancel, status, webhook |
| **Payments** | `payments` | Payment list/detail, COD confirm/reject, admin refunds |
| **Reviews** | `reviews` | Product reviews, summaries, store reputation |
| **Files** | `files` | File associations + secure download |
| **Notifications** | `notifications` | In-app notifications |
| **Dashboard** | `dashboard` | Admin / seller / customer analytics |
| **Health** | `../health` | Live + ready probes |

---

## Integrations

| Path | Role |
|------|------|
| `integrations/mail/` | SMTP + EJS templates (`MailService`) |
| `integrations/stripe/` | Shared Stripe SDK client (`StripeService`) — intents, cancel, refund helpers, webhook construct |
| `integrations/storage/` | Local disk storage + `STORAGE_PROVIDER` + multer helpers |

Domain modules own business rules; integrations stay thin adapters.

---

## Auth & authorization

**Defaults**

- Bearer auth required unless `@Auth(AuthType.NONE)`.
- `@Roles(...)` enforced by global `RolesGuard`; no `@Roles` → any authenticated user (when bearer is required).

**Roles** (`user_role_name_enum`): `BUYER`, `SELLER`, `SUPER_ADMIN` (multi-role via `UserRole` join table).

**Flow**

| Action | Behavior |
|--------|----------|
| Register | Creates user + `BUYER` role; welcome email; returns user summary (**no tokens**) |
| Login | Email/password; blocked → 403; issues access + refresh JWTs |
| Refresh | Rotates refresh; reuse of an old refresh revokes the whole `familyId` |
| Logout | Revokes refresh token from body |
| Forgot / reset | Password-reset JWT (`typ: PASSWORD_RESET`, ~1h) emailed |

**Tokens**

| Token | Payload highlights | TTL env | Storage |
|-------|--------------------|---------|---------|
| Access | `typ: ACCESS`, `sub`, `email`, `roles` | `JWT_ACCESS_TOKEN_TTL` (default `15m`) | Client / BFF |
| Refresh | `typ: REFRESH`, `familyId` | `JWT_REFRESH_TOKEN_TTL` (default `7d`) | Hashed in `RefreshToken` |

**Guards / decorators**

| Piece | Role |
|-------|------|
| `AuthenticationGuard` | Maps `@Auth` → `AccessTokenGuard` or allow-all |
| `AccessTokenGuard` | Verify Bearer, load user, reject deleted/blocked |
| `RolesGuard` | `@Roles` via `hasAnyRole` |
| `ThrottlerGuard` | Global 100/min; auth endpoints stricter; Stripe webhook skipped |
| `@ActiveUser()` | Current user id / roles from request |
| `@Match()` | Password-confirm validator helper |

---

## API endpoints

Auth: **Bearer required** unless noted public. Roles via `@Roles(...)`.

### Health — `@Controller('health')` (public, throttle skipped)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health/live` | Liveness |
| GET | `/health/ready` | Readiness (DB) |

### Auth — `@Controller('auth')` (all public)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/register` | Register buyer |
| POST | `/auth/login` | Login → access + refresh |
| POST | `/auth/forgot-password` | Password-reset email |
| POST | `/auth/reset-password` | Reset with token |
| POST | `/auth/refresh` | Rotate refresh |
| POST | `/auth/logout` | Revoke refresh |

### Users — `@Controller('users')`

| Method | Path | Auth / roles | Purpose |
|--------|------|--------------|---------|
| GET | `/users/me` | Auth | Current user + avatar |
| PATCH | `/users/me` | Auth | Update profile |
| PATCH | `/users/me/password` | Auth | Change password |
| POST | `/users/me/avatar` | Auth | Upload avatar |
| GET | `/users` | SUPER_ADMIN | Paginated users |
| GET | `/users/:id/detail` | SUPER_ADMIN | Admin user detail |
| GET | `/users/:id` | SUPER_ADMIN | User by id |
| PATCH | `/users/:id/block` | SUPER_ADMIN | Block / unblock |

### Seller profile — `@Controller('seller-profile')` + `@Controller('seller-profiles')`

| Method | Path | Auth / roles | Purpose |
|--------|------|--------------|---------|
| POST | `/seller-profile` | BUYER | Apply to sell |
| GET | `/seller-profile/me` | BUYER, SELLER | Own profile |
| PATCH | `/seller-profile/me` | BUYER, SELLER | Update own |
| POST | `/seller-profile/me/documents` | BUYER, SELLER | Upload BUSINESS_LICENSE / TAX_DOCUMENT |
| GET | `/seller-profile/:id` | SUPER_ADMIN | Profile by id |
| PATCH | `/seller-profile/:id/approve` | SUPER_ADMIN | Approve → create store + `SELLER` role + notify |
| PATCH | `/seller-profile/:id/reject` | SUPER_ADMIN | Reject + reason |
| PATCH | `/seller-profile/:id/suspend` | SUPER_ADMIN | Suspend |
| GET | `/seller-profiles` | SUPER_ADMIN | Paginated list |

### Stores — `@Controller('stores')`

| Method | Path | Auth / roles | Purpose |
|--------|------|--------------|---------|
| GET | `/stores/me` | SELLER | Own store |
| PATCH | `/stores/me` | SELLER | Update own |
| DELETE | `/stores/me` | SELLER | Soft-delete own |
| POST | `/stores/me/files` | SELLER | Upload LOGO / BANNER |
| DELETE | `/stores/me/files/:type` | SELLER | Remove LOGO / BANNER |
| GET | `/stores/slug/:slug` | Public | Public store by slug |
| GET | `/stores` | SUPER_ADMIN | List stores |
| GET | `/stores/:id` | SUPER_ADMIN | Store by id |
| PATCH | `/stores/:id/suspend` | SUPER_ADMIN | Suspend |
| PATCH | `/stores/:id/unsuspend` | SUPER_ADMIN | Unsuspend |
| PATCH | `/stores/:id/verify` | SUPER_ADMIN | Verify |
| PATCH | `/stores/:id/unverify` | SUPER_ADMIN | Unverify |

Admin store moderation is **verify / suspend only** (no generic admin PATCH/DELETE on `:id`).

### Categories — `@Controller('categories')`

| Method | Path | Auth / roles | Purpose |
|--------|------|--------------|---------|
| GET | `/categories` | Public | Paginated list |
| GET | `/categories/:id` | Public | By id |
| POST | `/categories` | SUPER_ADMIN | Create |
| PATCH | `/categories/:id` | SUPER_ADMIN | Update |
| DELETE | `/categories/:id` | SUPER_ADMIN | Soft-delete |
| PATCH | `/categories/:id/restore` | SUPER_ADMIN | Restore |

### Products — `@Controller('products')`

Seller-owned catalog mutations (no `SUPER_ADMIN` on create/update/lifecycle).

| Method | Path | Auth / roles | Purpose |
|--------|------|--------------|---------|
| GET | `/products/me` | SELLER | Seller’s products |
| GET | `/products` | Public | Catalog |
| GET | `/products/detail/:slug` | Public | By slug |
| GET | `/products/:id` | Public | By id |
| POST | `/products` | SELLER | Create (+ images) |
| PATCH | `/products/:id` | SELLER | Update |
| PATCH | `/products/:id/publish` | SELLER | Publish (ACTIVE) |
| PATCH | `/products/:id/archive` | SELLER | Archive |
| DELETE | `/products/:id` | SELLER | Soft-delete |
| PATCH | `/products/:id/restore` | SELLER | Restore |

### Product variants — `@Controller('product-variants')`

| Method | Path | Auth / roles | Purpose |
|--------|------|--------------|---------|
| GET | `/product-variants/me` | SELLER | Seller inventory |
| GET | `/product-variants` | Public | Catalog list |
| GET | `/product-variants/product/:productId` | Public | Variants for product |
| GET | `/product-variants/:id` | Public | By id |
| POST | `/product-variants` | SELLER | Create |
| PATCH | `/product-variants/:id` | SELLER | Update |
| DELETE | `/product-variants/:id` | SELLER | Delete |

### Cart — `@Controller('cart')` (auth)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/cart` | List items |
| POST | `/cart/sync` | Merge guest cart |
| POST | `/cart` | Add / update item |
| PATCH | `/cart/items/:variantId` | Update qty |
| DELETE | `/cart/items/:variantId` | Remove item |
| DELETE | `/cart` | Clear cart |

### Wishlist — `@Controller('wishlist')` (auth)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/wishlist` | List |
| POST | `/wishlist/sync` | Sync guest wishlist |
| POST | `/wishlist/toggle/:productId` | Add / remove product |

### Addresses — `@Controller('addresses')` (auth)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/addresses` | List |
| POST | `/addresses` | Create |
| PATCH | `/addresses/:id` | Update |
| DELETE | `/addresses/:id` | Delete |
| PATCH | `/addresses/:id/default` | Set default shipping / billing |

### Orders — `@Controller('orders')`

| Method | Path | Auth / roles | Purpose |
|--------|------|--------------|---------|
| POST | `/orders/webhooks/stripe` | Public (`SkipThrottle`) | Stripe webhook (raw body) |
| GET | `/orders` | Auth | Buyer orders |
| GET | `/orders/seller` | SELLER | Store orders |
| GET | `/orders/admin/all` | SUPER_ADMIN | All orders |
| POST | `/orders/checkout` | Auth | Start checkout (Stripe PI / COD) |
| POST | `/orders/checkout/complete` | Auth | Complete → orders |
| POST | `/orders/checkout/cancel` | Auth | Cancel session |
| GET | `/orders/:id` | Auth | Order detail |
| POST | `/orders/:id/cancel` | Auth | Cancel order |
| PATCH | `/orders/:id/status` | SELLER, SUPER_ADMIN | Update status |

Also: abandoned checkout expiry runs on an interval inside `ExpireAbandonedCheckoutsProvider`.

### Payments — `@Controller('payments')`

| Method | Path | Auth / roles | Purpose |
|--------|------|--------------|---------|
| GET | `/payments` | Auth | Buyer payments |
| GET | `/payments/seller` | SELLER | Store payments |
| GET | `/payments/admin/all` | SUPER_ADMIN | All payments |
| GET | `/payments/:id` | Auth | Payment detail |
| POST | `/payments/:id/cod/confirm` | SELLER, SUPER_ADMIN | Confirm COD |
| POST | `/payments/:id/cod/reject` | SELLER, SUPER_ADMIN | Reject COD |
| POST | `/payments/:id/refunds` | SUPER_ADMIN | Record refund (tracking; no Stripe call) |

### Reviews — `@Controller('reviews')`

| Method | Path | Auth / roles | Purpose |
|--------|------|--------------|---------|
| GET | `/reviews/product/:productId/summary` | Public | Rating summary |
| GET | `/reviews/product/:productId` | Public | Product reviews |
| GET | `/reviews/store/:storeId/reputation` | Public | Store reputation |
| GET | `/reviews/me` | Auth | My reviews |
| GET | `/reviews/seller` | SELLER | Reviews on my products |
| GET | `/reviews/admin/all` | SUPER_ADMIN | All reviews |
| GET | `/reviews/:id` | Auth | By id |
| POST | `/reviews` | Auth | Create (delivered purchase, one per product) |
| PATCH | `/reviews/:id` | Auth | Update own |
| DELETE | `/reviews/:id` | Auth (owner or admin) | Delete |

### Files — `@Controller('files')`

| Method | Path | Auth / roles | Purpose |
|--------|------|--------------|---------|
| GET | `/files/secure/:fileId` | Auth | Stream private file |
| GET | `/files/products/:productId` | Public | List product files |
| POST | `/files/products/:productId` | SELLER | Upload product file |
| DELETE | `/files/products/:productId/associations/:associationId` | SELLER | Delete association |
| GET | `/files/stores/me` | SELLER | My store files |
| GET | `/files/stores/:storeId` | Public | Store files |
| POST | `/files/stores/me` | SELLER | Upload my store file |
| POST | `/files/stores/:storeId` | SELLER | Upload store file |
| DELETE | `/files/stores/me/associations/:associationId` | SELLER | Delete my store file |
| DELETE | `/files/stores/:storeId/associations/:associationId` | SELLER | Delete store file |
| GET | `/files/users/me` | Auth | My user files |
| GET | `/files/users/:userId` | SUPER_ADMIN | User files |
| POST | `/files/users/me` | Auth | Upload my file |
| POST | `/files/users/:userId` | SUPER_ADMIN | Upload for user |
| DELETE | `/files/users/me/associations/:associationId` | Auth | Delete my file |
| DELETE | `/files/users/:userId/associations/:associationId` | SUPER_ADMIN | Delete user file |
| GET | `/files/seller-documents/me` | BUYER, SELLER | My seller docs |
| GET | `/files/seller-documents/:sellerProfileId` | SUPER_ADMIN | Seller docs |
| POST | `/files/seller-documents/me` | BUYER, SELLER | Upload my doc |
| POST | `/files/seller-documents/:sellerProfileId` | SUPER_ADMIN | Upload for profile |
| DELETE | `/files/seller-documents/me/associations/:associationId` | BUYER, SELLER | Delete my doc |
| DELETE | `/files/seller-documents/:sellerProfileId/associations/:associationId` | SUPER_ADMIN | Delete seller doc |

### Notifications — `@Controller('notifications')` (auth)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/notifications` | List |
| GET | `/notifications/unread` | Unread list |
| GET | `/notifications/unread-count` | Unread count |
| PATCH | `/notifications/read-all` | Mark all read |
| GET | `/notifications/:id` | Get one (own) |
| PATCH | `/notifications/:id/read` | Mark one read |

### Dashboard — `@Controller('dashboard')`

| Method | Path | Auth / roles | Purpose |
|--------|------|--------------|---------|
| GET | `/dashboard/admin` | SUPER_ADMIN | Platform analytics |
| GET | `/dashboard/seller` | SELLER | Seller analytics |
| GET | `/dashboard/customer` | Auth | Customer overview |

### Static (not controllers)

- `GET /uploads/*` — public static assets
- Private subdirs under `/uploads/{subdir}` return **404** for `sellers` and `customer-documents`; use `/files/secure/:id`

---

## Database (Prisma)

Schema: `prisma/schema.prisma`. Soft deletes via `deletedAt` on `User`, `SellerProfile`, `Store`, `Category`, `Product` (not on `ProductVariant`).

### Models

| Area | Models |
|------|--------|
| Identity | `User`, `UserRole`, `RefreshToken`, `UserAddress` |
| Seller | `SellerProfile` (1:1 User) → `Store?` (1:1), `SellerDocument[]` |
| Catalog | `Category` → `Product[]` → `ProductVariant[]`, `ProductFile[]`, `Review[]`, `WishlistItem[]` |
| Commerce | `CartItem`, `CheckoutSession` + items, `Order` → `OrderItem[]` + optional `Payment` |
| Files | `StoredFile` hub; `ProductFile`, `UserFile`, `StoreFile`, `SellerDocument` |
| Comms | `Notification` |

### Notable enums

| Enum | Values (high level) |
|------|---------------------|
| Roles | `BUYER`, `SELLER`, `SUPER_ADMIN` |
| Seller status | `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED` |
| Store status | `ACTIVE`, `SUSPENDED` |
| Product status | `ACTIVE`, `DRAFT`, `ARCHIVED` |
| Order status | `PENDING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| Payment | providers `STRIPE` / `COD` / `OTHER`; status lifecycle |
| Notifications | order / seller / product / system types |

### Migrations present

- `20260717000000_baseline`
- `20260804170000_buyer_addresses_and_notification_types`
- `20260805220000_production_readiness_indexes`

---

## DTOs & providers

**DTOs**

- `class-validator` + `@nestjs/swagger` (`@ApiProperty` / Optional).
- Naming: Create / Update / Query / Response; updates often `PartialType(CreateXDto)`.
- Global `ValidationPipe`: whitelist, transform, forbidNonWhitelisted, implicit conversion.
- Multipart uploads use `@ApiConsumes('multipart/form-data')`.

**Providers**

- Use-case classes under `providers/` (~100+ across modules).
- Services are thin facades that delegate to providers.
- Shared helpers: `*-ownership.provider.ts`, map utils, query utils.

Example: `SellerService` → `CreateSellerProfileProvider`, `ApproveSellerProfileProvider`, …

---

## Cross-cutting (`src/common/`)

| Path | Role |
|------|------|
| `crypto/` | Password hashing (`HashingProvider` → bcrypt) |
| `prisma/` | Shared Prisma select/include helpers |
| `swagger/` | Swagger setup + extra models |
| `pagination/` | Shared pagination DTOs / helpers |
| `filters/` | `AllExceptionsFilter`, `PrismaExceptionFilter`, `HttpExceptionFilter` |
| `guards/` | `RolesGuard` (global) |
| `interceptors/` | `DataResponseInterceptor` |
| `middleware/` | `requestIdMiddleware` (`x-request-id`) |
| `utils/` | Authorization helpers (`hasAnyRole`, …) |

**`main.ts` extras:** `rawBody: true` (Stripe), `trust proxy`, helmet, compression, CORS, static `/uploads/` with private subdirs blocked, shutdown hooks.

### Module-local pipes / interceptors

- Files: upload interceptors + `RequireUploadedFilePipe`
- Products: `ParseProductImagesPipe`
- Nest `FileInterceptor` / `FilesInterceptor` with multer disk options

---

## Notable features

- **Multi-vendor:** buyer → seller application → admin approve → store + `SELLER` role + notification.
- **Checkout:** Stripe PaymentIntents + webhook; COD with seller/admin confirm/reject.
- **Inventory:** variants with stock; order flow adjusts stock (row locks on checkout).
- **Files:** public static uploads vs private secure download; seller documents private.
- **Notifications:** order / seller lifecycle events.
- **Dashboards:** admin (revenue, pending sellers, low stock…), seller, customer.
- **Soft deletes** + product publish / archive lifecycle (seller-owned).
- **Store moderation:** admin verify / suspend (no generic admin store edit endpoint).
- **Throttling** + stricter auth limits; Stripe webhook unthrottled.
- **Seeders:** admin seed active (`ALLOW_ADMIN_SEED`); demo seed providers present but mostly commented out.

---

## Environment

Template: `.env.example`. Validated via Joi in `config/`.

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | `development` / `production` / `test` |
| `PORT` | Default `3001` |
| `API_VERSION` | Response `version` only (default `v1`) |
| `FRONTEND_URL` | CORS; required URI in production (comma-separated OK) |
| `DATABASE_URL` | PostgreSQL |
| `UPLOADS_ROOT` | Optional local root (default `{cwd}/uploads`) |
| `JWT_SECRET` | Min 16; rejects common weak values |
| `JWT_ACCESS_TOKEN_TTL` / `JWT_REFRESH_TOKEN_TTL` | Defaults `15m` / `7d` |
| `STRIPE_SECRET_KEY` | Required |
| `STRIPE_WEBHOOK_SECRET` | Required in production |
| `SWAGGER_ENABLED` | Boolean; forced off in production |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `SMTP_USERNAME`, `SMTP_PASSWORD` | Mail |
| `ALLOW_ADMIN_SEED`, `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PHONE`, `ADMIN_PASSWORD` | Bootstrap admin |
| `SEED_DEMO_DATA` | Demo seed flag |

Config namespaces: `app`, `jwt`, `mail`, `stripe`, `storage`, `database`.

---

## Docs / tooling

- OpenAPI UI: `/api` (disabled in production; controlled by `SWAGGER_ENABLED` in non-prod).
- Static uploads: `/uploads/` (private subdirs blocked; secure files via `/files/secure/:id`).
- Env template: `.env.example`.

### Scripts

```bash
npm run start:dev              # watch mode
npm run start:debug            # debug + watch
npm run start:prod             # production (node dist/main)
npm run build                  # prisma generate && nest build
npm run lint
npm run format
npm run test                   # Jest unit
npm run test:watch
npm run test:cov
npm run test:e2e
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:migrate:deploy
```

---

## How to explore a domain

1. Open the module under `src/modules/<name>/`.
2. Read the controller for routes + roles.
3. Follow the service into `providers/` for business rules.
4. Check `dto/` for request/response shapes and `prisma/schema.prisma` for persistence.
5. On the client, find the matching BFF under `client/src/app/api/v1/{admin|customer|seller}/…`.
