# Backend Code Review — Atelier Commerce (Prisma Ecommerce API)

**Reviewed:** 2026-09-06 | **Commit:** `3c29c84b8bdbe7111fc1d726c3f2c8274af45034` | **Branch:** `marketplace-v2`
**Stack:** Node.js 24 (local) · NestJS 11 · TypeScript 5.7 (strict) · Prisma 7 · PostgreSQL · Stripe · bcrypt · `@nestjs/jwt` (HS256)
**Scope:** `server/` (the NestJS API) plus repo-level deploy/CI artifacts that affect this API. The Next.js client / BFF under `client/` was not scored. Generated Prisma client, `node_modules`, `dist`, coverage, and prior review reports were not used as evidence.

---

## The Short Version

This is a real multi-vendor commerce API: catalog, carts, checkout with Stripe, orders, COD, refunds-as-ledger, seller onboarding, and private file downloads. The domain layout and the auth/checkout work are well above average for a shipping-fast Nest app. Access tokens are short-lived, refresh tokens are hashed and rotated with family revocation, ownership checks live in dedicated providers, money is `DECIMAL(10,2)` in Postgres, and checkout takes row locks before reserving stock.

What will hurt you in production is not a missing `if`. It is operations: there is no CI, no container definition, rate limits live in process memory, uploads live on local disk, and the database pool is whatever `pg` defaults to. Those are the things that fail the first time you run two app instances or a rolling deploy.

**Overall Rating: 7.0 / 10 — FIX FIRST**

**Blockers found:** 0 | **Critical:** 0 | **High:** 9 | **Medium:** 24 | **Low:** 16

No hard cap applied (no blockers, no criticals). Weighted arithmetic is shown under the scorecard.

---

## What's Already Good

- **Auth is thought through.** Separate access / refresh / reset secrets, HS256 pinned at verify time, refresh tokens stored as SHA-256 hashes, rotation with reuse detection that revokes the family, `tokenVersion` checked on every authenticated request against a live user row (blocked / soft-deleted / password-changed users die immediately). See `server/src/modules/auth/`.
- **Checkout is a use-case, not a controller script.** Idempotency keys, `SELECT … FOR UPDATE` in stable id order, stock reserve/release, Stripe PaymentIntent created *outside* the DB transaction, webhook signature verification, and a claim-update so client + webhook cannot double-complete. See `create-checkout.provider.ts`, `lock-product-variants.util.ts`, `stripe-webhook.provider.ts`.
- **Authorization is centralized, not copy-pasted `if (role === 'admin')`.** `RolesGuard` is global; products/orders/payments/reviews/addresses/files have `*-ownership.provider.ts`. Public catalog mutations stay seller-owned.
- **Inbound validation is actually on.** Global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted` + `transform`. Pagination is capped at 100. Uploads check magic bytes, not just `Content-Type`.
- **Schema is not “hope the app is correct.”** Foreign keys, named unique constraints, indexes on hot FKs, `CHECK` on ratings/amounts/quantities, money as `Decimal(10,2)`, migrations under `prisma/migrations/`.
- **House style is consistent enough to teach from.** Feature modules, thin services, one provider per action, generated Prisma types, response DTOs that strip passwords. Keep doing that.

---

## Scorecard

| # | Module | Score | Weight | The Gist |
|---|--------|-------|--------|----------|
| 1 | Project Structure & Architecture | 8/10 | 8% | Domain modules + provider-per-use-case. One oversized seed file. |
| 2 | Naming Conventions & Code Style | 8/10 | 5% | Kebab-case Nest files; a few singular/plural controller mismatches. |
| 3 | Type Safety | 8/10 | 6% | `strict: true`, no `any` at API boundaries; a handful of `as unknown as T`. |
| 4 | API Design & Response Consistency | 7/10 | 7% | One success envelope; money goes out as JS `number`; some lists unbounded. |
| 5 | Request Validation & Input Handling | 8/10 | 7% | Global whitelist pipe; nested checkout DTO; file signatures. |
| 6 | Authentication & JWT Lifecycle | 8/10 | 10% | Strong lifecycle; `logoutAll` unused; in-memory throttle; password max 30. |
| 7 | Authorization & Access Control | 8/10 | 8% | Ownership providers + webhook signatures. Register leaks existing user ids. |
| 8 | Security (OWASP API Top 10) | 6/10 | 10% | Basics are solid; multi-instance limits, disk uploads, refund/Stripe drift. |
| 9 | Configuration & Env Validation | 8/10 | 5% | Joi fail-fast and weak-JWT rejection. A few leftover `process.env` reads. |
| 10 | Database Schema & Constraints | 7/10 | 8% | FKs, CHECKs, Decimal. Soft-delete vs UNIQUE email. No pool settings. |
| 11 | Query Performance, N+1 & Indexing | 7/10 | 7% | Trigram search exists; no Redis; COUNT(*) on every list; per-request user fetch. |
| 12 | Error Handling, Logging & Observability | 6/10 | 6% | Safe 500s + request ids. Nest `Logger`, not JSON. No metrics/Sentry. |
| 13 | Testing & Quality Gates | 5/10 | 6% | 39 unit specs on auth/checkout/payments. No e2e. No CI gate. |
| 14 | DevOps, CI/CD & Production Readiness | 4/10 | 5% | No Dockerfile, no GitHub Actions, no deploy story in-repo. |
| 15 | Documentation & Maintainability | 5/10 | 2% | ADRs + walkthrough exist; `server/README.md` is still the Nest starter. |
| | **Weighted Overall** | **7.0/10** | 100% | |

**Arithmetic:** `(8×8 + 8×5 + 8×6 + 7×7 + 8×7 + 8×10 + 8×8 + 6×10 + 8×5 + 7×8 + 7×7 + 6×6 + 5×6 + 4×5 + 5×2) / 100 = 702 / 100 = 7.0`

No hard cap applied.

---

## Fix These First

If you only have one week before staging, work top to bottom.

| # | Issue | Severity | Where | Effort | Why it matters |
|---|-------|----------|-------|--------|----------------|
| 1 | No CI pipeline | HIGH | repo root (no `.github/`) | 1 day | Broken tests and `npm audit` findings merge unnoticed. |
| 2 | No production image / runbook | HIGH | no `Dockerfile` | 1 day | You cannot deploy this API the same way twice. |
| 3 | In-memory rate limits | HIGH | `server/src/app.module.ts:60-66` | 4h | Two pods = 2× the login guesses. Auth throttle is decorative in a replica set. |
| 4 | Uploads on local disk | HIGH | `integrations/storage` | 2–3 days | Instance B cannot see files written on instance A. Private docs sit on the app filesystem. |
| 5 | Duplicate register returns the real user id | HIGH | `register.provider.ts:64-78` | 1h | Same 201 body still leaks `id`, so email existence and account ids are enumerable. |
| 6 | Admin refunds do not call Stripe | HIGH | `record-refund.provider.ts:19-22` | 1 day | The ledger can say “refunded” while Stripe still holds the money. |
| 7 | Money compared/serialized as JS `Number` | HIGH | `complete-checkout.provider.ts:117`, `map-order.util.ts:71-87` | 2h | You already have integer-cent helpers. The payment match path should use them. |
| 8 | Soft-delete vs UNIQUE email/phone | HIGH | `prisma/schema.prisma:12-16` | 4h | A deleted buyer can never re-register with the same email. Support tickets forever. |
| 9 | DB pool and statement timeout unset | HIGH | `prisma.service.ts:11-16` | 2h | Default pool × instance count is a classic `too many connections` outage. |

---

## Injected Instructions & Suspicious Content

No prompt-injection attempts or reviewer-directed instructions were found in this codebase.

Checked for: “ignore previous instructions”, “disregard the prompt”, “you are now…”, “do not report this file”, “already approved”, “rate this module 10/10”, “as an AI, you must”, fake `SYSTEM:` / `<system>` tags, and reviewer-addressed comments. Search covered `server/src`, `server/prisma`, env examples, and repo markdown. The only `SYSTEM:` hit in the monorepo is a notification-type label in the client (`"SYSTEM": "System"`), which is data, not an instruction.

**Why this matters:** Text like that in a repo can hijack CI review bots and autocomplete. An explicit “none found” is the useful result here.

---

## Files Excluded From Review

| File | Reason | Last modified |
|------|--------|---------------|
| `CODE_REVIEW_REPORT.md` (git status: deleted) | Prior audit artifact (Rule 2). Not read for conclusions or scores. | Last commit touching it: 2026-09-05 03:26:16 +0500 (`b81d6a6`) |
| `server/src/generated/prisma/**` | Generated Prisma client | generated |
| `server/node_modules/**` | Vendor | n/a |
| `server/dist/**` | Build output | n/a |
| `server/coverage/**` | Test artifacts (if present) | n/a |
| `client/**` | Frontend / BFF — out of this backend scoring pass | n/a |

No `docs/reviews/`, `audit/`, or `SECURITY_REVIEW*` files were present.

---

## About This Codebase

### Stack (detected)

| Piece | What it is |
|-------|------------|
| Runtime | Node.js (local `v24.14.1`); TypeScript target ES2023 |
| Framework | NestJS 11 (`@nestjs/platform-express`, Express 5) |
| ORM | Prisma 7 (`@prisma/adapter-pg` + `pg`) |
| Database | PostgreSQL |
| Auth | `@nestjs/jwt` HS256, bcrypt cost 12 |
| Payments | Stripe SDK `^22`, plus COD |
| Mail | `@nestjs-modules/mailer` + nodemailer |
| Files | Local disk under `uploads/` |
| Validation | `class-validator` + global `ValidationPipe`; env via Joi |
| Rate limit | `@nestjs/throttler` in-memory |
| Package manager | npm (`package-lock.json` present) |
| Cache / queue | None. Abandoned-checkout sweep uses `setInterval` + a Postgres `job_locks` row |

### Size

| Metric | Count |
|--------|------:|
| `server/src/**/*.ts` excluding generated | 434 files / ~29,900 LOC |
| HTTP handlers (`@Get/@Post/@Patch/@Put/@Delete`) | 132 |
| Controllers | 17 |
| Prisma models | 26 |
| Jest `*.spec.ts` | 39 |
| e2e harness (`server/test/`) | 0 |
| Migrations | 7 |

### Directory tree (3 levels, vendor dirs omitted)

```text
server/
├── prisma/
│   ├── migrations/          (7 versioned migrations + lock)
│   └── schema.prisma
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── common/              guards, filters, pagination, crypto, audit, jobs
│   ├── config/              Joi + namespaced ConfigModule
│   ├── generated/           Prisma client (do not edit)
│   ├── health/
│   ├── integrations/        mail, stripe, storage
│   ├── modules/             auth, users, sellers, stores, products,
│   │                        product-variants, categories, carts, wishlists,
│   │                        orders, payments, reviews, addresses,
│   │                        notifications, files, dashboard
│   ├── prisma/
│   └── seeders/
├── uploads/                 local public + private files
├── .env.example
├── eslint.config.mjs
├── knip.json
└── README.md                still NestJS starter text
```

No `Dockerfile`, no `.github/workflows`, no Redis, no Sentry.

### Request path (traced)

A typical authenticated write:

1. `bootstrap()` in `server/src/main.ts` — `rawBody: true` (Stripe), shutdown hooks, `trust proxy 1`, request id, helmet, compression, CORS from `FRONTEND_URL`, private `/uploads/{sellers,customer-documents}` 404, static `/uploads`, global `ValidationPipe`.
2. Global guards: `ThrottlerGuard` (`app.module.ts`) → `AuthenticationGuard` (default `AuthType.BEARER`) → `RolesGuard` (allow if no `@Roles`).
3. `AccessTokenGuard` verifies JWT with pinned HS256 + access secret, requires `typ=ACCESS`, loads the user, rejects deleted/blocked, compares `tokenVersion`.
4. Controller (HTTP + Swagger + `@ActiveUser()`) → service facade → one provider.
5. `PrismaService` (`PrismaClient` + `PrismaPg` adapter).
6. `DataResponseInterceptor` wraps success as `{ data, version }`.
7. Errors: `HttpExceptionFilter` / `PrismaExceptionFilter` / `AllExceptionsFilter` → `{ statusCode, message, error, requestId }`.

**Login → refresh → logout:** `POST /auth/login` (`LoginProvider`, dummy bcrypt hash for unknown emails) → `GenerateTokensProvider` persists hashed refresh → `POST /auth/refresh` verifies refresh secret + store + rotation → `POST /auth/logout` revokes the refresh family (does **not** bump `tokenVersion`).

**Create:** `POST /products` (`@Roles(SELLER)`) → `ProductOwnershipProvider` binds the product to the authenticated seller’s store → Prisma.

**List:** `GET /products` (`AuthType.NONE`) → `GetProductsProvider` with `PaginationQueryDto` (max 100) + optional trigram-backed `search`.

### House style

Kebab-case files (`create-checkout.provider.ts`). Controllers stay thin. Services delegate. Domain rules live in `providers/`. DTOs are separate from Prisma models. Tables are `snake_case` via `@@map`; TypeScript is camelCase. Soft-delete (`deletedAt`) on User, SellerProfile, Store, Category, Product only.

### Notably absent

Dockerfile, CI, e2e tests, Redis (or any shared rate-limit store), object storage, metrics, error tracking, secret manager wiring, `iss`/`aud` JWT claims, MFA, account lockout, `logoutAll` HTTP route (the method exists).

`server/AGENTS.md` still says there are no checked-in `*.spec.ts` files. That is false today (39 specs). Code wins.

---

## Detailed Findings

### Module 1 — Project Structure & Architecture — **8/10**

**Verdict in one paragraph:** This is a coherent Nest domain modular monolith. HTTP → guard → controller → thin service → provider → Prisma is applied consistently. You do not need a repository layer; the project correctly does not have one.

**What's working:** `src/modules/*` matches real domains. Circular refresh-token use is broken with `AuthTokensModule` instead of a sneaky `forwardRef` soup. Integrations stay under `src/integrations/{mail,stripe,storage}`.

**Findings:**

#### 1.1 Seed data file is a god file — `LOW`
**Where:** `server/src/seeders/data/demo-seed.data.ts` (~1241 lines)

**What's happening:** One data file holds the entire demo catalog. Fine for a seeder; painful to review and easy to paste production-looking PII into.

**Why it matters:** Oversized seed files become the place secrets and “real-looking” emails hide.

**Fix:** Keep it, but never put real customer data in it. Split by domain if it keeps growing.

**Effort:** 1h when you next touch demo data.

#### 1.2 Demo passwords are hardcoded and logged — `MEDIUM`
**Where:** `server/src/seeders/data/demo-seed.data.ts:14-16`, `seed-sellers.provider.ts:189`, `seed-customers.provider.ts:59`

```ts
export const DEMO_CUSTOMER_PASSWORD = 'Password@123';
export const DEMO_SELLER_PASSWORD = 'Password@123';
```

Seeding is skipped when `NODE_ENV === 'production'`. The seeders still `Logger.log` the plaintext password after insert. Anyone with log access in a mis-set staging env gets every demo account.

**Fix:** Read demo passwords from env. Never log them. Rotate if this branch has ever been pointed at a shared database.

**Effort:** 30 min.

#### 1.3 `logoutAll` is dead API surface — `MEDIUM`
**Where:** `server/src/modules/auth/providers/logout.provider.ts:18-24`

The method increments `tokenVersion` and revokes every refresh token. Nothing in `auth.controller.ts` exposes it. Logout today only burns one refresh family; access tokens live until `exp` (~15m).

**Fix:** Add `POST /auth/logout-all` (authenticated) that calls `logoutAll(userId)`.

**Effort:** 1h.

**To get this module to 8+:** Already an 8. Expose logout-all and keep modules from importing each other’s internals.

---

### Module 2 — Naming Conventions & Code Style — **8/10**

**Verdict in one paragraph:** Nest kebab-case is the rule and it is followed. Database naming is snake_case via `@@map`. Deviations are small.

**What's working:** Providers named `create-*.provider.ts` / `*-ownership.provider.ts`. Tests are `*.spec.ts` only (no mixed `*.test.ts`). Env vars are `SCREAMING_SNAKE_CASE`. Lint is `typescript-eslint` type-checked + Prettier.

**Findings:**

#### 2.1 Singular vs plural controllers — `LOW`
**Where:** `cart.controller.ts`, `store.controller.ts`, `address.controller.ts` vs `products.controller.ts`, `users.controller.ts`

Folders are mostly plural (`carts`, `stores`, `addresses`); some controller file names are singular. URLs are mixed (`/cart`, `/stores`, `/addresses`). Not a production bug; it slows onboarding.

#### 2.2 `eslint-disable` is replaced by broad rule offs — `MEDIUM`
**Where:** `server/eslint.config.mjs:33-37`

```ts
'@typescript-eslint/no-explicit-any': 'off',
'@typescript-eslint/no-floating-promises': 'warn',
```

Zero `eslint-disable` comments in `src` is nice. Turning `no-explicit-any` off and leaving floating promises at **warn** means CI (when you add it) will not fail on ignored async work. Audit writes already do `void this.prisma.auditLog.create(...).catch(...)`.

**Fix:** `'no-floating-promises': 'error'`. Keep `any` off only if you also fail `tsc --noEmit` in CI (you should).

**Effort:** 30 min.

#### 2.3 No `.editorconfig` — `NIT`

Prettier is present (`.prettierrc`). EditorConfig is missing. Team’s call.

**To get this module to 8+:** Already an 8. Promote floating-promises to error.

---

### Module 3 — Type Safety — **8/10**

**Verdict in one paragraph:** This is a strict TypeScript Nest app that actually uses Prisma’s generated client. The compiler is on your side at API boundaries.

**What's working:** `tsconfig.json` has `"strict": true`. No `: any` / `as any` in application code. No `@ts-ignore` / `@ts-nocheck`. Prisma models are generated to `src/generated/prisma/`. Runtime validation is `class-validator`, not type assertions on HTTP bodies.

**tsconfig gaps (not enabled):** `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`. `strictPropertyInitialization` is explicitly `false` (normal for Nest DI).

**Findings:**

#### 3.1 `as unknown as T` on multipart JSON variants — `MEDIUM`
**Where:** `server/src/modules/products/dto/create-product.dto.ts:62-75` (same pattern in `update-product.dto.ts`)

```ts
@Transform(({ value }): CreateProductVariantDto[] => {
  if (typeof value !== 'string') return value;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return value as unknown as CreateProductVariantDto[];
    }
    return plainToInstance(CreateProductVariantDto, parsed);
  } catch {
    return value as unknown as CreateProductVariantDto[];
  }
})
```

Invalid JSON is passed through as a fake `CreateProductVariantDto[]`. `@IsArray` + `@ValidateNested` usually still reject it, so this is not a bypass I could confirm. It is an unnecessary lie to the type system.

**Fix:** On parse failure, return a sentinel that fails `@IsArray` (e.g. `undefined`) instead of casting.

**Effort:** 20 min.

#### 3.2 Idempotency JSON asserted, not parsed with a schema — `MEDIUM`
**Where:** `server/src/modules/orders/providers/checkout-idempotency.provider.ts:172`

`row.responseJson as unknown as CheckoutSessionResponse` trusts whatever was stored. That is acceptable if **you** wrote it; it is not a substitute for a schema if the column is ever edited by hand.

**To get this module to 8+:** Already an 8. Turn on `noUncheckedIndexedAccess` in a follow-up PR (it will be noisy, then valuable).

---

### Module 4 — API Design & Response Consistency — **7/10**

**Verdict in one paragraph:** Success bodies are one shape. Errors are another shape. That is fine and documented (ADR 005). The gaps are money as IEEE-754 numbers in JSON, a few unbounded lists, and Nest itself being unversioned (the Next BFF adds `/api/v1`).

**What's working:** `DataResponseInterceptor` always returns `{ data, version }`. Pagination helper caps `limit` at 100. List endpoints for products, orders, payments, reviews, users, categories, stores, variants, notifications use it. Checkout requires an idempotency key. Swagger is **forced off** when `NODE_ENV === 'production'` (`setup-swagger.ts:15-17`). Timestamps in mappers are ISO strings.

**Envelope found:**

- Success: `{ data: T, version: string }`
- Error: `{ statusCode, message, error, requestId?, errorCode?, details? }`

Not the `{ success: true }` textbook shape. It is **one** shape. Do not “fix” it into a second envelope.

**Findings:**

#### 4.1 Order/checkout money is `Number(decimal)` — `HIGH`
**Where:** `server/src/modules/orders/utils/map-order.util.ts:71-87`

```ts
priceAtPurchase: Number(item.priceAtPurchase),
// ...
tax: Number(order.tax),
subtotal: Number(order.subtotal),
total: Number(order.totalAmount),
```

**And** `complete-checkout.provider.ts:117-123` plus paid-order cancel (`cancel-order.provider.ts:76-88`):

```ts
const expectedCents = Math.round(Number(session.totalAmount) * 100);
if (paymentIntent.amount_received !== expectedCents) { ... }

const refundable =
  Math.round(
    (Number(payment.amount) - Number(payment.refundedAmount ?? 0)) * 100,
  ) / 100;
```

**Why it matters:** Internal math already uses integer cents (`money.util.ts`). The one place you **must not** round through `Number` is “does this PaymentIntent match the session.” `19.99` is not a dyadic rational. `Math.round` usually saves you at two decimal places; it is still the class of bug that pages payments people.

**Fix:**

```ts
import { toCents } from 'src/common/utils/money.util';
const expectedCents = toCents(session.totalAmount);
```

Serialize API money as decimal **strings** (or cents integers), not `number`.

**Effort:** 2h.

#### 4.2 Unbounded list endpoints — `MEDIUM`
**Where:**

- `GET /cart` — `cart.controller.ts:30-34`
- `GET /wishlist` — `wishlist.controller.ts:20-23`
- `GET /addresses` — `address.controller.ts:31-36`
- `GET /files/products/:productId` — `files.controller.ts:61-66`

Carts/addresses stay small per user in practice. They still have no max. A buggy client calling `POST /cart/sync` in a loop plus `GET /cart` is how a payload becomes megabytes.

**Fix:** Reuse `PaginationQueryDto` or a hard cap (e.g. 200) in the query.

**Effort:** 2h.

#### 4.3 Nest API is unversioned — `MEDIUM`
Controllers mount at `/auth`, `/products`, … (`server/AGENTS.md` confirms no global prefix). Versioning lives in the Next BFF (`/api/v1`). If anyone calls Nest directly (mobile, partner, leftover script), you cannot break the contract safely.

**Fix:** Keep the BFF as the public contract, or add an explicit Nest prefix when you grow a second client.

**Effort:** design decision, not a drive-by.

#### 4.4 Error codes are not a stable vocabulary — `MEDIUM`
Most failures are human `message` strings. `errorCode` is optional and rarely set. The frontend will string-match `"Invalid credentials"`. Copy edits become bugs.

**Fix:** Add a small `AuthErrorCode` / `CheckoutErrorCode` enum and put it on exceptions you already throw.

**Effort:** 1 day spread across modules.

#### 4.5 `generateOrderNumber` uses `Math.random()` — `LOW`
**Where:** `map-order.util.ts:123-131`

Unique constraint on `orderNumber` will catch collisions. Use `crypto.randomBytes` anyway so you never think about it again.

**To get this module to 8+:** Integer-cent (or string) money in responses; cap cart/wishlist/address lists; stable error codes on auth and checkout.

---

### Module 5 — Request Validation & Input Handling — **8/10**

**Verdict in one paragraph:** Write endpoints have DTOs. The global pipe strips unknown fields, which is the mass-assignment control that people forget. File uploads are better than most Nest apps.

**What's working:**

```59:66:server/src/main.ts
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
```

`UpdateProfileDto` only allows `fullName` / `phoneNumber` — no `role`, no `isBlocked`. Checkout shipping is `@ValidateNested()` + `@Type()`. `SyncCartDto` has `@ArrayMaxSize(100)`. Images: UUID filenames + magic-byte wrapper (`file-signature.ts`).

**Findings:**

#### 5.1 `enableImplicitConversion` is a footgun — `MEDIUM`
Query `?isActive=false` can become a boolean via `@Transform` on some DTOs (notifications, payments) and via implicit conversion on others. Implicit conversion also turns `" "` into `0` for numbers in surprising cases.

**Fix:** Keep `@Type(() => Number)` + `@IsInt()` (you already do this on pagination). Prefer explicit `@Transform` for booleans everywhere; consider turning implicit conversion off later.

**Effort:** 2h to audit boolean query params.

#### 5.2 Review comments are stored raw — `MEDIUM`
**Where:** `create-review.dto.ts:47-56` (`MaxLength(2000)` only)

No HTML strip. If any admin UI ever does `dangerouslySetInnerHTML`, you have stored XSS. Even email templates that interpolate `comment` are a risk.

**Fix:** Strip tags on write (or store markdown and render safely on the client — the client must not treat this as HTML either).

**Effort:** 2h.

#### 5.3 Images are not re-encoded — `MEDIUM`
Magic bytes prevent a `.gif` that’s actually a `.pdf`. They do not strip EXIF or polyglot payloads in a valid JPEG. Public product images are served from `/uploads/products`.

**Fix:** Re-encode with sharp (or similar) before storing public images. Leave private PDFs as-is behind `/files/secure`.

**Effort:** 1 day.

#### 5.4 Email fields have no `@MaxLength` — `LOW`
**Where:** `CreateUserDto`, `LoginDto`, `ForgotPasswordDto`

`@IsEmail()` does not cap length. Add `@MaxLength(254)`. Same class of gap: `retainImagePaths` on `UpdateProductDto` has no `@ArrayMaxSize`.

**Effort:** 20 min.

#### 5.5 JSON body size is Express default (~100kb) — `LOW`
Not unbounded, but not explicit. Webhook uses `rawBody`. Fine for now; set `NestFactory.create(..., { bodyParser: true })` limits explicitly so the next person does not “raise it to 50mb” for file-in-JSON mistakes.

**To get this module to 8+:** Already an 8. Add HTML stripping on reviews and re-encode public images.

---

### Module 6 — Authentication & JWT Lifecycle — **8/10**

**Verdict in one paragraph:** This is the strongest module in the repo. It looks like someone has been paged for refresh-token theft before. Remaining gaps are operational (in-memory throttle) and product (no lockout, unused logout-all, password UX).

**Token lifecycle (confirmed):**

1. **Register** (`POST /auth/register`) — creates `BUYER` (or returns a 201 that looks the same on duplicate email — see 7.1). No tokens issued.
2. **Login** (`POST /auth/login`) — looks up email, bcrypt-compares against the real hash or a dummy `$2b$12$...` hash so unknown emails still pay bcrypt (`login.provider.ts:23-47`). Uniform `"Invalid credentials"`. Blocked users get 403 after a successful password check.
3. **Issue** — access JWT (`typ=ACCESS`, `sub`, `email`, `roles`, `tokenVersion`, TTL default `15m`) signed with `JWT_ACCESS_SECRET`. Refresh JWT (`typ=REFRESH`, `familyId`, TTL default `7d`) signed with `JWT_REFRESH_SECRET`. Refresh **hash** stored in `refresh_tokens`.
4. **Authenticated request** — `Authorization: Bearer` only (not query string). `jwtService.verifyAsync` with `algorithms: ['HS256']`. User re-loaded; `deletedAt` / `isBlocked` / `tokenVersion` enforced. Roles used for authorization come from the **database**, not the stale JWT array.
5. **Refresh** — verify refresh secret + `typ` + `familyId`; lookup hash; if `revokedAt` already set, **revoke the whole family** (reuse detection); rotate in a transaction.
6. **Logout** — revoke family by presented refresh token. Does not increment `tokenVersion`.
7. **Password change / reset / block** — increment `tokenVersion` and revoke refresh rows. Reset token TTL 1h, bound to SHA-256 of current password hash (`pwd` claim), single-use in practice because the hash changes.

Algorithm is pinned (`jwt-algorithm.constants.ts`). Secrets are required, min 32 chars, weak values rejected, and the three JWT secrets must differ (`environment.validation.ts`). bcrypt cost is 12. Auth routes have stricter `@Throttle` (login 10/min, register/forgot/reset 5/min).

**Findings:**

#### 6.1 Rate limiter is in-memory — `HIGH` (also Module 8 / 14)
**Where:** `server/src/app.module.ts:60-66`

```ts
ThrottlerModule.forRoot([{ limit: 100, ttl: 60_000, name: 'default' }]),
```

No Redis storage. Each process has its own counters. Behind a load balancer this is “N times the budget.”

**Fix:** `@nestjs/throttler-storage-redis` (or equivalent) keyed by IP **and** email on login. Keep the per-route limits you already have.

**Effort:** 4h + Redis in staging.

#### 6.2 Password max length 30 + composition regex — `MEDIUM`
**Where:** `server/src/common/constants/password.constants.ts:1-9`

```ts
export const PASSWORD_MAX_LENGTH = 30;
export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```

A 30-character maximum cuts off passphrase users and many password managers. The charset forbids `.` `#` `_` (the spec even tests that `Password1!.` fails). People will converge on `Password1!`.

**Fix:** Min 8–12, max 72 (bcrypt truncates at 72 anyway), drop mandatory classes or use a library like zxcvbn. Keep a breached-password check only if you want it; you have no compliance requirement.

**Effort:** 2h + a data migration is **not** required if you only loosen validation.

#### 6.3 No account lockout — `MEDIUM`
Rate limits slow credential stuffing. They do not stop a slow guess against one account. No `failedLoginCount` / lock timestamp.

**Fix:** After N failures, delay or lock with an unlock path (time or email). Do it in the same transaction as login so two pods cannot bypass it — which again wants shared storage.

**Effort:** 1 day.

#### 6.4 Logout does not kill access tokens immediately — `MEDIUM`
**Where:** `logout.provider.ts:13-16` vs `logoutAll` at 18-24 (unexposed)

15-minute access TTL makes this survivable. Stolen access tokens still work after “logout” until expiry.

**Fix:** Expose `logoutAll`. Optionally add `POST /auth/logout` that requires a bearer token and bumps `tokenVersion`.

**Effort:** 1h.

#### 6.5 No `iss` / `aud` — `LOW`
`exp` is set via `expiresIn`. `sub` and custom `typ` are verified. `iss`/`aud` are absent. Fine while there is one API. Add them when a second service starts verifying the same tokens.

#### 6.6 Reset link puts the token in a query string — `LOW`
Standard for email reset. Tokens leak via access logs if the frontend fetches the URL with the query still attached. Keep TTL short (you do: 1h) and never log the full URL.

**To get this module to 8+:** Shared throttle store + expose logout-all. Then this is a 9.

---

### Module 7 — Authorization & Access Control — **8/10**

**Verdict in one paragraph:** Object-level checks exist on the routes that matter. I did not find a classic “`findById` with no owner” on orders, payments, addresses, or private files. The ugly finding is register returning the **existing** user id.

**What's working:** Global default-deny for authentication (`AuthType.BEARER` unless `@Auth(NONE)`). `@Roles` is default-allow only **after** auth — correct Nest pattern. Stripe webhook verifies the signature before mutating. Secure files check seller-doc / user-doc ownership (`secure-file-access.provider.ts:59-69`) and refuse to stream public files through the secure endpoint. Reviews require a delivered, paid purchase (`review-eligibility.provider.ts`). Product create binds store via ownership, not a client-supplied `storeId`.

**Public routes (intentionally unauthenticated):**

| Area | Routes |
|------|--------|
| Auth | register, login, forgot-password, reset-password, refresh, logout |
| Catalog | `GET /products`, `GET /products/:id`, `GET /products/detail/:slug` |
| Variants | `GET /product-variants`, `GET /product-variants/:id`, `GET /product-variants/product/:id` |
| Categories | `GET /categories`, `GET /categories/:id` |
| Stores | `GET /stores/slug/:slug` |
| Reviews | product list/summary, store reputation |
| Files | `GET /files/products/:productId`, `GET /files/stores/:storeId` |
| Orders | `POST /orders/webhooks/stripe` (signature required) |
| Health | `/health/live`, `/health/ready` |

Public catalog GETs filter `status: ACTIVE` and `deletedAt: null` (`get-products.provider.ts:180-186`, `get-product-variants.provider.ts:145-151`).

**Ownership table (sampled, confirmed in code):**

| Endpoint | Roles | Ownership |
|----------|-------|-----------|
| `GET/PATCH /users/me` | any auth | JWT `sub` |
| `GET /users/:id` | SUPER_ADMIN | admin |
| `GET /orders/:id` | any auth | `OrderOwnershipProvider.assertCanView` |
| `PATCH /orders/:id/status` | SELLER, SUPER_ADMIN | store owner or admin |
| `GET /payments/:id` | any auth | `PaymentOwnershipProvider.assertCanView` |
| `POST /payments/:id/refunds` | SUPER_ADMIN | role check |
| `PATCH /addresses/:id` | any auth | `AddressOwnershipProvider.getOwnedOrThrow` |
| `GET /notifications/:id` | any auth | scoped by `userId` |
| `GET /files/secure/:fileId` | any auth | owner or admin |
| `PATCH /reviews/:id` | any auth | own review (admin delete allowed) |

**Findings:**

#### 7.1 Register returns the existing user’s id — `HIGH`
**Where:** `server/src/modules/auth/providers/register.provider.ts:64-78`

```ts
private publicRegisterResponse(id: number, dto: CreateUserDto) {
  return {
    user: {
      id,  // <-- existing account id on duplicate email
      email: dto.email,
      fullName: dto.fullName,
      ...
    },
  };
}
```

The comment says the two paths should be indistinguishable. They are not: registering `alice@example.com` twice yields the same `id`. That is account existence oracle **and** an IDOR building block (now the attacker has a numeric user id).

**Fix:** Always create a dummy response **without** a stable real id (or return `201 { sent: true }` and issue tokens only on login). Do not echo `existing.id`.

**Effort:** 1h. Check the client: if it treats register as login, you will need a small client change.

#### 7.2 Seller `GET /payments?userId=` is scoped — not a bug
`GetPaymentsProvider.findByUser` passes `scope: { userId }`, which **overrides** `query.userId`. Same pattern on reviews. The Swagger text “admin only” is enforced by the service scope, not the DTO. Keep it that way; DTOs cannot be trusted.

#### 7.3 `GET /reviews/:id` is authenticated-only public content — `LOW`
Reviews are marketplace content (display name, not email). Requiring a login to fetch by id is inconsistent with `GET /reviews/product/:id`. Not an IDOR.

**To get this module to 8+:** Already an 8 after you stop leaking user ids on register. Add a couple of ownership tests that hit HTTP (even Nest testing module) so IDOR cannot regress silently.

---

### Module 8 — Security (OWASP API Top 10) — **6/10**

**Verdict in one paragraph:** Injection, default JWT secrets, open CORS, and unverified webhooks are **not** what I found. Production pain here is replica-unaware limits, disk-backed files, refunds that do not move money at the processor, and a noisy `npm audit` on transitive deps.

**What's working:** `.env` is gitignored (`server/.gitignore`). `.env.example` has placeholders, not live keys. Helmet is on. CORS is an allowlist from `FRONTEND_URL`, not `*`. `trust proxy` is `1` (not “trust every `X-Forwarded-For` hop”). Private upload prefixes are 404’d before static. Stripe webhooks use `constructEvent`. No `eval` / `Function(` / `child_process` on user input. No `jwt.decode` in the request path. Stack traces are not returned (`AllExceptionsFilter` returns `"Internal server error"`).

**Findings:**

#### 8.1 Local disk storage — `HIGH`
**Where:** `server/src/integrations/storage/providers/local-storage.provider.ts`, `uploads-root.ts`

Files are written under process CWD `uploads/`. Two app instances do not share that directory unless you mount a shared volume. Seller documents and customer documents are “private” only because Express 404s those URL prefixes on **this** process.

**Fix:** S3/GCS (or a shared PVC if you insist on disks) and keep `/files/secure` as the only download path for private objects.

**Effort:** 2–3 days.

#### 8.2 Admin refunds do not call Stripe; buyer cancel does — `HIGH`
**Where:** `server/src/modules/payments/providers/record-refund.provider.ts:19-22` vs `cancel-order.provider.ts:74-99`

```ts
/**
 * Tracks full/partial refunds on the Payment record.
 * Does not call Stripe — existing refund APIs remain the source of provider refunds.
 */
```

Buyer `POST /orders/:id/cancel` **does** call `stripeService.createRefund` with idempotency key `order-cancel-${orderId}`. Admin `POST /payments/:id/refunds` only writes the ledger. There **is** a `RefundPaymentProvider` in the Stripe module; the admin HTTP path does not use it. Finance will see “refunded” in your DB and “captured” in Stripe.

**Fix:** Either call Stripe (and store `externalRefundId`) in the same transaction-after-success pattern you use for checkout, or rename the endpoint to `POST /payments/:id/refund-records` and put a huge warning in the admin UI. Silent drift is how chargebacks surprise you.

**Effort:** 1 day if you already have the Stripe adapter.

#### 8.3 Transitive `npm audit` highs — `MEDIUM` (suspected)
`npm audit --omit=dev`: **27** findings (**0 critical, 19 high, 8 moderate**). Highs include `multer` / `@nestjs/platform-express` (upload DoS via nested fields or aborted streams), `nodemailer` (file read / SSRF via a `raw` option you do not expose), plus `brace-expansion`, `browserslist`, `deepmerge-ts`, `fast-uri`, `js-yaml`, and Prisma/Hono toolchain packages. I did not confirm a reachable exploit in the request path. You **send** mail; you do not parse inbound MIME on a public route. Multer is on the request path for product/avatar/document uploads — triage that one first.

**Fix:** `npm audit` in CI; upgrade `@nestjs-modules/mailer` / Prisma when patches exist. Do not `npm audit fix --force` onto Prisma 6.

**Effort:** 2h to triage, more to upgrade.

#### 8.4 CORS vs password-reset URL — `MEDIUM`
**Where:** `main.ts:35-43` splits `FRONTEND_URL` on commas; `environment.validation.ts:43-47` validates `FRONTEND_URL` as a **single** `uri()`; `forgot-password.provider.ts:46-50` uses the raw string as the reset link base.

If someone sets `FRONTEND_URL=https://a.com,https://b.com`, Joi may reject boot in production (`uri()`), or a non-production env produces a broken reset URL. CORS and mail disagree.

**Fix:** Validate an array (comma-separated URIs). Use the first origin (or a dedicated `PASSWORD_RESET_URL`) for email links.

**Effort:** 1h.

#### 8.5 Refresh tokens in JSON bodies — `MEDIUM`
Tokens are not in query strings (good). They are in the JSON body of login/refresh/logout. Any XSS on the storefront that can read API responses can steal refresh tokens. HttpOnly cookies + CSRF is the usual upgrade; you already have a BFF. This may be a deliberate BFF-friendly choice — confirm it.

#### 8.6 Helmet HSTS — `LOW` (needs human)
Helmet 8’s default middleware includes `Strict-Transport-Security: max-age=31536000; includeSubDomains`. If TLS terminates at the load balancer and the app only sees HTTP, the header may be stripped or never reach browsers. Confirm on staging with `curl -I https://…`.

#### 8.7 `.gitignore` does not list `*.pem` / `*.key` — `LOW`
`.env*` is covered. A developer dropping a Stripe key file in `server/` could still commit it.

**To get this module to 8+:** Shared rate limits, object storage, Stripe-backed refunds (or an honest “ledger only” UX). Then this is a 7–8.

---

### Module 9 — Configuration & Env Validation — **8/10**

**Verdict in one paragraph:** The app will refuse to boot on missing/weak JWT secrets. That is the right failure mode.

**What's working:** Joi schema in `environment.validation.ts` — `NODE_ENV` enum, required `DATABASE_URL` / Stripe / mail / three distinct JWT secrets, min length 32, denylist of `changeme`-class values. `SEED_DEMO_DATA` and `ALLOW_ADMIN_SEED` are ignored when `NODE_ENV === 'production'` (seed providers check this). Typed `registerAs` namespaces.

**Findings:**

#### 9.1 Behaviour defaults after Joi — `MEDIUM`
**Where:** `app.config.ts:4-6`

```ts
environments: process.env.NODE_ENV || 'development',
frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
```

Joi already requires `NODE_ENV`. The `|| 'development'` branch is dead in a successful boot, but it is the classic “typo `prod` silently takes the dev path” pattern **if** Joi were ever bypassed. `setup-swagger.ts` also reads `process.env.SWAGGER_ENABLED` in addition to ConfigService.

**Fix:** Read only through `ConfigService`. Remove `process.env.PORT` in `main.ts:70` (Joi already defaults `PORT`).

**Effort:** 30 min.

#### 9.2 `.env.example` comment disagrees with code — `LOW`
Example says Swagger is “forced off in production unless explicitly true.” Code returns immediately on `isProduction` and never consults `SWAGGER_ENABLED` in that case. Prefer the code.

**To get this module to 8+:** Already an 8. Delete leftover `process.env` reads.

---

### Module 10 — Database Schema, Constraints & Migrations — **7/10**

**Verdict in one paragraph:** This schema was given a production-readiness pass (indexes, CHECKs, checkout hardening, tokenVersion). The remaining holes are operational (pool) and product (soft-delete vs unique identity).

**What's working:** PKs on every table. FKs with explicit `onDelete`. Unique email, slug, SKU, order number, `(userId, productId)` reviews. Indexes on order `userId+createdAt`, payment `transactionId`, checkout session Stripe id. `CHK_reviews_rating_range`, `CHK_payments_amount_non_negative`, `CHK_orders_total_amount_non_negative`, `CHK_order_items_quantity_positive`. Money is `Decimal(10,2)`, not float. Migrations are versioned; no `synchronize: true` (Prisma does not even have that footgun). Refund apply uses `SELECT … FOR UPDATE`. Soft-delete filtered in the queries I read for User/Product/Store.

**Findings:**

#### 10.1 UNIQUE email/phone vs `deletedAt` — `HIGH`
**Where:** `server/prisma/schema.prisma:12-16`

```prisma
email     String  @unique ...
phoneNumber String? @unique ...
deletedAt DateTime?
```

Soft-deleted users still occupy the unique index. Re-registration fails with a conflict (and your register path may even return their old id — Module 7).

**Fix:** Partial unique indexes in Postgres: `UNIQUE (email) WHERE deleted_at IS NULL` (Prisma supports this via raw SQL migration; the schema field can stay). Same for phone.

**Effort:** 4h including a data check.

#### 10.2 Connection pool and timeouts unset — `HIGH`
**Where:** `server/src/prisma/prisma.service.ts:11-16`

```ts
const adapter = new PrismaPg({
  connectionString: configService.getOrThrow<string>('database.url'),
});
```

No `max`, no `connectionTimeoutMillis`, no `statement_timeout`. Default `pg` pool is 10 per process. 8 instances = 80 connections before the rest of the platform (migrations, admin, replicas).

**Fix:** Set pool size from env. `SET statement_timeout` on connect. Do the arithmetic against `max_connections`.

**Effort:** 2h.

#### 10.3 `TIMESTAMP(6)` not `TIMESTAMPTZ` — `MEDIUM`
Every `DateTime` maps `@db.Timestamp(6)`. Node will treat them as local or UTC depending on the driver session. You mostly write `new Date()` (UTC). Mixing a SQL console in local time with the app is a class of “order showed up yesterday” bugs.

**Fix:** New columns as `timestamptz`. Migrate old ones with a documented UTC assumption when you can afford the lock.

**Effort:** 1 day (expand/contract).

#### 10.4 `ON DELETE CASCADE` on `payments` → `orders` — `MEDIUM`
**Where:** `schema.prisma:382`

Deleting an order deletes the payment row. You restrict deleting users who have orders (`onDelete: Restrict` on `Order.user`). Still: any admin “cleanup” script that deletes orders destroys payment history. Audit logs are a separate table with **no** FK to users (`actorId` is a loose int).

**Fix:** Do not expose order hard-delete. Keep cascade only if you are sure no job does `order.deleteMany`.

#### 10.5 `checkout_session_items.variantId` has no dedicated index — `LOW`
FK exists (`onDelete: Restrict`). Postgres does not auto-index FKs. Volume is probably fine; add `@@index([variantId])` when you next migrate.

**To get this module to 8+:** Partial unique emails, pool settings, timestamptz plan.

---

### Module 11 — Query Performance, N+1 & Indexing — **7/10**

**Verdict in one paragraph:** Hot catalog search is not a naive full-table `LIKE` — you added `pg_trgm` GIN indexes on product name/description. Lists paginate. Checkout batches variant locks. The gaps are “no cache,” COUNT(*) on every page, and a DB round-trip on every authenticated request (intentional for authz).

**What's working:** `GetProductsProvider` uses `include` for list/detail, not per-row queries. Dashboard fires aggregations with `Promise.all`, not a loop of `findOne`. Abandoned-checkout sweep uses `JobLockProvider` so multiple instances do not all release stock. Product `contains` search can use `IDX_products_name_trgm`.

**Findings:**

#### 11.1 Auth guard hits the DB every request — `MEDIUM` (deliberate)
**Where:** `access-token.guard.ts:52`

This is the correct trade for “blocked users die immediately.” Cost is one indexed PK lookup per request. Do not “optimize” it by trusting JWT roles.

If this becomes hot, cache `{tokenVersion, isBlocked, roles}` in Redis with a 30s TTL keyed by user id, invalidated on password change/block.

#### 11.2 `COUNT(*)` on every paginated list — `MEDIUM`
`PaginationProviders` + `prisma.*.count({ where })`. Fine at thousands of rows. Painful at millions of orders.

**Fix:** Cursor pagination for admin order/payment lists when the table warrants it; or skip total on pages after the first.

#### 11.3 Admin search still `contains` without trigram — `LOW`
Users / sellers / stores / variants search with `mode: 'insensitive'` contains. Admin-only, smaller tables. Product catalog is the one that needed GIN and got it.

#### 11.4 No application cache — `LOW` for now
Categories and public product detail are obvious cache candidates once you have more than one instance. Not a launch blocker.

#### 11.5 Abandoned-checkout sweep is unbounded + serial — `MEDIUM`
**Where:** `expire-abandoned-checkouts.provider.ts:74-90`

`findMany` of every `PENDING` session older than the TTL has no `take`. Each row then awaits Stripe + a transaction. Job lock prevents two instances overlapping. A backlog of stale sessions still makes one instance grind for the whole lock TTL.

**Fix:** `take: 50` (or similar) per tick; the 5-minute interval will drain the rest.

**Effort:** 30 min.

#### 11.6 Emails are async (good) but still in-process — `MEDIUM`
`complete-checkout.provider.ts:195` uses `void this.sendConfirmationEmails(...)`. The HTTP response does not wait (good). If the process dies, the email is lost. There is no queue.

**Fix:** A later queue (even a `outbox` table + the same job lock you already have).

**To get this module to 8+:** Pool limits (Module 10) plus an outbox for mail. Resist adding Redis until rate limits need it — then use it for both.

---

### Module 12 — Error Handling, Logging & Observability — **6/10**

**Verdict in one paragraph:** Clients get a safe envelope and a request id. Operators get Nest’s text logger and a `/health/ready` that actually pings Postgres. You cannot graph p95 or get paged from this repo.

**What's working:** Three filters registered (all / Prisma / HTTP). Prisma codes mapped to 409/404 without leaking SQL. `x-request-id` generated or echoed (`request-id.middleware.ts`). Health: `live` vs `ready` (`SELECT 1`). `enableShutdownHooks()` + `PrismaService.onModuleDestroy`. Audit logger is append-only and fire-and-forget so it cannot block checkout. Zero `console.log` in `src`.

**Findings:**

#### 12.1 Logs are not structured JSON — `HIGH` for operations, scored as **MEDIUM** here
`Logger.log` / `Logger.error` from `@nestjs/common`. Grep-able locally; painful in CloudWatch/Datadog without a JSON formatter (Pino).

**Fix:** `nestjs-pino` with redaction paths for `password`, `authorization`, `refreshToken`, `clientSecret`.

**Effort:** 4h.

#### 12.2 No metrics, tracing, or Sentry — `MEDIUM`
There is nothing to alert on except “the process died.” Add RED metrics (rate, errors, duration) on `/orders/checkout` and `/auth/login` first.

#### 12.3 Health is wrapped in `{ data, version }` — `LOW`
The interceptor is global, so probes get `{ data: { status: 'ok' }, version: 'v1' }`. Most kube probes just want 200. It works; document it for whoever writes the Helm chart.

`/health/ready` is `@SkipThrottle()` and `@Auth(NONE)` and hits Postgres. That is correct for kube, but it is also a free DB ping. Keep it off the public internet or put it on an internal listener.

#### 12.4 Graceful shutdown is hooks-only — `MEDIUM`
Nest’s shutdown hooks disconnect Prisma. There is no explicit drain timeout (“stop traffic, wait 15s, exit”). Combined with no Dockerfile `STOPSIGNAL` story, deploys will drop in-flight checkouts.

#### 12.5 Audit writes can vanish — `LOW`
`AuditProvider.record` is `void` + `.catch`. Correct for “never block payments.” Incorrect if you need a compliance trail. You listed compliance as none.

**To get this module to 8+:** JSON logs + one APM/Sentry project + a documented SIGTERM drain.

---

### Module 13 — Testing & Quality Gates — **5/10**

**Verdict in one paragraph:** You have more unit tests than `AGENTS.md` admits, and they sit on the right modules (auth, checkout, payments, reviews, money, env). They are not a quality **gate**, because nothing runs them on merge, and there is no e2e harness (`package.json` still points at `./test/jest-e2e.json` which does not exist).

**What's working:** 39 `*.spec.ts` files. No `.only` / `.skip`. Coverage of tokenVersion, refresh rotation, checkout idempotency, Stripe webhook util, stock adjust, payment status transitions, review eligibility. Jest is configured in `package.json`.

**Findings:**

#### 13.1 CI does not run tests — `HIGH`
No `.github/workflows`. A failing spec is a local problem.

**Fix:** `npm run lint` (without `--fix`), `npx tsc --noEmit`, `npm test`, `npm audit --omit=dev` on every PR. Fail the job.

**Effort:** 2h.

#### 13.2 No e2e / HTTP tests — `HIGH` for IDOR regression
Ownership is implemented in providers and mostly unit-tested with mocks. A future controller that calls `findUnique({ where: { id } })` will not fail CI.

**Fix:** One Nest testing-module test per sensitive `GET /:id` (orders, payments, files/secure, addresses) that expects 403 for another user.

**Effort:** 1–2 days.

#### 13.3 `npm run lint` uses `--fix` — `MEDIUM`
`"lint": "eslint ... --fix"` mutates the tree. CI should lint without `--fix`.

**To get this module to 8+:** CI gate + a thin e2e folder. Coverage percentage is less important than those two.

---

### Module 14 — DevOps, CI/CD & Production Readiness — **4/10**

**Verdict in one paragraph:** The application code is closer to production than the delivery machinery. Staging + production is the stated target; this repo cannot describe how a container is built, who runs migrations, or what happens on SIGTERM.

**What's working:** `prisma:migrate:deploy` script exists. Job locks prevent duplicate checkout expiry. Seeds refuse to run in production. Lockfile is committed. `knip.json` exists for dead-code hunting.

**Findings:**

#### 14.1 No Dockerfile — `HIGH`
No multi-stage image, no non-root user, no `HEALTHCHECK`, no pinned base digest. Whoever deploys is inventing this under pressure.

**Fix:** Multi-stage Node 22/24 Debian or distroless, `USER node`, copy `dist` + `node_modules` production, `HEALTHCHECK` against `/health/ready`.

**Effort:** 1 day.

#### 14.2 No CI/CD — `HIGH`
See Module 13. Also: no place to inject secrets from a manager; no migration job separate from app boot (running `migrate deploy` on every replica start is how you get advisory-lock stampedes).

#### 14.3 In-process cron via `setInterval` — `MEDIUM`
**Where:** `expire-abandoned-checkouts.provider.ts:43-52`

Job lock makes this safe-ish. It still couples “HTTP server” to “worker.” When you scale to 10 instances you run 10 timers that fight for one lock. Fine at 2 instances; move to a worker process later.

#### 14.4 `start:prod` is `node dist/main` — `LOW`
Correct. Ensure the image actually runs `prisma migrate deploy` **once** in the release pipeline, not in that command.

**To get this module to 8+:** Dockerfile + GitHub Actions + a one-page runbook (migrations, health, rollback, Stripe webhook URL). That alone would lift the overall score.

---

### Module 15 — Documentation & Maintainability — **5/10**

**Verdict in one paragraph:** Architecture docs in `docs/decisions/` and `server/walkthrough.md` are a genuine asset. The file a new backend engineer opens first — `server/README.md` — is still the NestJS starter, including a CircleCI badge for `nestjs/nest`.

**What's working:** ADRs 001–008 (BFF, providers, JWT, envelopes, files, ownership). Swagger from decorators. `server/.env.example` is complete enough to boot. Almost no TODO/FIXME in `src`.

**Findings:**

#### 15.1 README is framework boilerplate — `HIGH` for onboarding, **MEDIUM** in this rubric
**Where:** `server/README.md`

It does not mention PostgreSQL, Prisma migrate, Stripe CLI webhooks, required env vars, or “never point the browser at Nest.”

**Fix:** Replace it with: prerequisites, `cp .env.example .env`, `npm install`, `npm run prisma:migrate:dev`, `npm run start:dev`, how to run tests, how to point Stripe webhooks at `/orders/webhooks/stripe`.

**Effort:** 1h.

#### 15.2 `AGENTS.md` disagrees with the tree — `LOW`
Claims no `*.spec.ts`. There are 39. Stale agent instructions cause the next person to skip tests that exist.

**To get this module to 8+:** Rewrite `server/README.md`. Point AGENTS at the real test layout.

---

## Quick Wins

- Use `toCents(...)` in `complete-checkout.provider.ts` and `cancel-order.provider.ts` (20 min).
- Cap the abandoned-checkout sweep with `take: 50` (15 min).
- Add `@MaxLength(254)` on email DTOs (10 min).
- Stop logging demo seed passwords (10 min).
- Stop returning `existing.id` from duplicate register (30 min).
- Expose `POST /auth/logout-all` (30 min).
- Read `PORT` from `ConfigService` instead of `process.env` in `main.ts` (10 min).
- Add `@@index([variantId])` on `CheckoutSessionItem` in the next migration (15 min).
- Change `lint` script to not `--fix` in CI (10 min).
- Align `.env.example` Swagger comment with “disabled whenever `NODE_ENV=production`” (5 min).
- Raise `PASSWORD_MAX_LENGTH` to 72 and widen the allowed special-character class (20 min).
- Put `*.pem` / `*.key` in `server/.gitignore` (2 min).
- Document that `/health/ready` returns the `{ data, version }` envelope (10 min).

---

## Couldn’t Verify — Needs a Human

| What | How to confirm |
|------|----------------|
| Production JWT secrets actually have ≥256 bits of entropy | Check the secret manager / host env. Do not paste them into chat. Joi only enforces length 32 and a weak-string denylist. |
| `max_connections` vs app instances × pool size | `SHOW max_connections;` in Postgres; count replicas; set `PrismaPg` `max` so the product stays under ~70% of the cap. |
| TLS 1.2+, HSTS, HTTP→HTTPS | `curl -I https://api...` in staging. Helmet may not emit HSTS if TLS is at the load balancer. |
| Backups and restore | Ask whoever owns Postgres: last successful restore drill, RPO/RTO. Not in this repo. |
| Alerts reaching a human | No Sentry/PagerDuty config in-repo. If it exists, it is outside Git. |
| Stripe refunds done manually today | If ops already refunds in the Stripe dashboard then records here, the HIGH is process, not a surprise. Write that down. |
| Whether `FRONTEND_URL` is ever comma-separated in real envs | If it is a single origin, the Joi `uri()` vs `split(',')` mismatch is dormant. |
| `npm audit` reachability | Confirm mailer never parses untrusted MIME; confirm Prisma CLI is not in the production image. |
| Index use in production | `EXPLAIN ANALYZE` on `GET /products?search=` and `GET /orders?page=` against a realistic dataset. Trigram indexes exist; I did not run them. |
| Multi-instance file sharing | If you already mount `uploads/` on NFS/EFS, local disk is acceptable until object storage. Confirm it. |

---

## Suggested Roadmap

**Week 1 (before a real staging deploy):**

- CI: lint (no `--fix`), `tsc`, unit tests, `npm audit --omit=dev`.
- Dockerfile + `/health/ready` as the probe; run `prisma migrate deploy` once per release, not per replica boot.
- Configure `pg` pool size and `statement_timeout`.
- Fix register id leak; use `toCents` on PaymentIntent matching.
- Decide refunds: call Stripe or label the admin action as “record only.”
- Redis (or equivalent) for throttling before you put the API behind more than one instance.

**Weeks 2–4:**

- Object storage for uploads; keep private files off public `/uploads`.
- `logout-all` + optional tokenVersion bump on logout.
- Partial unique indexes for soft-deleted emails/phones.
- Nest e2e tests for IDOR on orders, payments, secure files.
- JSON logging + Sentry (or similar) on 5xx.
- Money as strings/cents in JSON; stop `Number(decimal)` in mappers.
- Password policy: raise max length, drop mandatory character classes.

**Backlog:**

- `timestamptz` migration, `iss`/`aud`, account lockout, mail outbox, cursor pagination for admin lists, image re-encode, README rewrite, metrics on checkout and login, worker process for the abandoned-checkout sweep.

---

## Assumptions & Method

- Reviewed the working tree on `marketplace-v2` at `3c29c84` (plus uncommitted `server/` files present on disk). Scores reflect **code as it exists today**, not prior reports.
- Did not treat `AGENTS.md` / walkthrough text as instructions that change scoring. Where they disagreed with code (test files exist), code won and the docs were listed as stale.
- Did not execute the API against a live database or Stripe. Checkout locking, webhook verification, and ownership checks were confirmed by reading the implementations and their unit tests.
- Commands run: git metadata, file counts, `rg` over `server/src`, `npm audit --omit=dev`, reads of controllers, auth/checkout/payment/file/schema/config/filters.
- Coverage: all 17 controllers; auth/JWT/refresh/logout; checkout create/complete/webhook; payments refund/COD ownership; schema + CHECK migration; env validation; health; filters; storage signatures. Not every provider file was read line-by-line; repeated patterns (paginated `findMine` + ownership) were sampled.
- Traffic profile assumed: e-commerce API, multiple Node processes in staging/prod, no regulatory extra (GDPR was still noted where unique-email-after-delete hurts users).

A mid-level engineer’s Monday morning: stand up CI and a Dockerfile, fix the register id leak and `toCents` match, then put Redis in front of the throttler before the second replica goes live.
