# Backend Code Review — Atelier Commerce (Prisma Ecommerce API)

**Reviewed:** 2026-09-05 | **Commit:** `c658e6c637b56c2533871d87163a5b2147be735f` | **Branch:** `marketplace-v2`
**Stack:** Node.js + NestJS 11 + TypeScript 5.7 + Prisma 7 + PostgreSQL + Stripe 22 + bcrypt + Joi + Helmet
**Scope:** `server/` only (Nest API, Prisma schema/migrations, config, tests). The Next.js BFF under `client/` was not scored. Generated Prisma client, `node_modules`, and `dist` were not treated as reviewable source.

---

## The Short Version

This is a multi-vendor e-commerce API (catalog, cart, checkout, orders, payments, sellers, stores) with a real domain structure and several production-minded patterns already in place: hashed rotating refresh tokens, Stripe webhook signature checks, checkout stock locks, and a global validation pipe that strips unknown fields.

The code is better than most apps at this stage. The things that will hurt you in production are not “the architecture is wrong.” They are ops and hardening: there is no CI pipeline and no container story, rate limits live in process memory (so they get weaker as you add pods), checkout idempotency is optional, file uploads trust the `Content-Type` header, and TypeScript is not running `strict`.

There are **no blockers** and **no confirmed criticals**. It can go to staging. It should not go to production until the week-1 list below is done — especially CI, a required checkout idempotency key, a stronger JWT secret policy, and a shared rate-limit store if you run more than one instance.

**Overall Rating: 6.0 / 10 — FIX FIRST**

**Blockers found:** 0 | **Critical:** 0 | **High:** 14 | **Medium:** 18 | **Low:** 9

---

## What's Already Good

- **Default-deny auth, then explicit public routes.** `AuthenticationGuard` is a global `APP_GUARD` and defaults to bearer. Public endpoints opt out with `@Auth(AuthType.NONE)` — `server/src/modules/auth/guards/authentication/authentication.guard.ts:17-36`.
- **Refresh tokens are hashed, rotated, and reuse-detected.** `RefreshTokenStoreProvider` stores SHA-256 hashes, rotates in a transaction, and revokes the whole family on reuse — `server/src/modules/auth/providers/refresh-token-store.provider.ts:9-110`.
- **Access tokens are not trusted blindly.** Every request re-loads the user and rejects deleted/blocked accounts — `server/src/modules/auth/guards/access-token/access-token.guard.ts:53-67`. Roles come from the database, not a stale JWT claim.
- **Checkout concurrency is taken seriously.** Variants are `SELECT … FOR UPDATE` in sorted id order, stock is reserved atomically, and abandoned sessions are swept with a DB job lock — `server/src/modules/orders/utils/lock-product-variants.util.ts:10-24`, `server/src/modules/orders/providers/expire-abandoned-checkouts.provider.ts:62-68`.
- **Stripe webhooks verify the signature** before mutating state — `server/src/modules/orders/providers/stripe-webhook.provider.ts:27-43`.
- **Money is `DECIMAL(10,2)` in Postgres**, not `FLOAT` — `server/prisma/schema.prisma:160`, `:315`, `:367`.
- **Ownership is a first-class pattern** (`*-ownership.provider.ts` for orders, payments, products, variants, stores, reviews, addresses, notifications) instead of scattered `if (user.role === 'admin')` checks.
- **Env validation fails the boot** via Joi — `server/src/config/environment.validation.ts:3-45`. Weak JWT placeholder values are rejected.
- **Private uploads are blocked on the public static mount** and served through an ownership-checked download — `server/src/main.ts:49-56`, `server/src/modules/files/providers/secure-file-access.provider.ts:59-70`.

---

## Scorecard

| # | Module | Score | Weight | The Gist |
|---|--------|-------|--------|----------|
| 1 | Project Structure & Architecture | 8/10 | 8% | Domain modules + thin services + one-provider-per-use-case. Keep this. |
| 2 | Naming Conventions & Code Style | 8/10 | 5% | Consistent kebab-case Nest style. Legacy DB constraint names are the only mess. |
| 3 | Type Safety | 6/10 | 6% | Prisma types are generated, but `strict` is off and `noImplicitAny` is false. |
| 4 | API Design & Response Consistency | 6/10 | 7% | One success envelope. Checkout idempotency is optional. Money math is JS `number`. |
| 5 | Request Validation & Input Handling | 6/10 | 7% | Global whitelist pipe is excellent. Uploads trust `Content-Type`. |
| 6 | Authentication & JWT Lifecycle | 6/10 | 10% | Strong refresh/session design. Same secret for every token type; bcrypt cost is default 10. |
| 7 | Authorization & Access Control | 7/10 | 8% | Ownership providers + global `RolesGuard`. Most `:id` routes check access. Tests are thin. |
| 8 | Security (OWASP API Top 10) | 5/10 | 10% | Helmet/CORS/secrets look fine. In-memory throttle and MIME trust will bite at scale. |
| 9 | Configuration & Env Validation | 7/10 | 5% | Joi fail-fast. JWT minimum length is 16 characters — too short for HS256. |
| 10 | Database Schema & Constraints | 7/10 | 8% | FKs, indexes, Decimal money, versioned migrations. Missing CHECKs and `timestamptz`. |
| 11 | Query Performance, N+1 & Indexing | 5/10 | 7% | List endpoints paginate. `rating_desc` loads every matching product id into memory. |
| 12 | Error Handling, Logging & Observability | 6/10 | 6% | Request ids + safe filters. Nest `Logger`, no metrics, no error tracker. |
| 13 | Testing & Quality Gates | 4/10 | 6% | 19 focused unit specs on checkout/auth. No e2e. No CI that runs them. |
| 14 | DevOps, CI/CD & Production Readiness | 3/10 | 5% | No Dockerfile, no GitHub Actions, no deploy/runbook in-repo. |
| 15 | Documentation & Maintainability | 6/10 | 2% | ADRs and walkthroughs are real. `server/README.md` is still the Nest starter text. |
| | **Weighted Overall** | **6.0/10** | 100% | |

Arithmetic: `(8×8 + 8×5 + 6×6 + 6×7 + 6×7 + 6×10 + 7×8 + 5×10 + 7×5 + 7×8 + 5×7 + 6×6 + 4×6 + 3×5 + 6×2) / 100 = 603 / 100 = 6.0`.

No hard cap applied (no BLOCKER anywhere, no CRITICAL anywhere). Module 13 is not the “no tests at all → max 3” case — tests exist, they just do not gate a release.

---

## Fix These First

If you only have one week, work top to bottom.

| # | Issue | Severity | Where | Effort | Why it matters |
|---|-------|----------|-------|--------|----------------|
| 1 | Checkout idempotency key is optional | HIGH | `server/src/modules/orders/providers/create-checkout.provider.ts:50-51` | 2h | Double-click / retry creates a second stock reservation and Stripe PaymentIntent. |
| 2 | Rate limiter is in-memory | HIGH | `server/src/app.module.ts:60-66` | 4h | N pods = N× the login/OTP budget. Credential stuffing gets easier as you scale. |
| 3 | JWT secret min length is 16; one secret for all token types | HIGH | `server/src/config/environment.validation.ts:21-31` | 2h | 16 chars is not 256 bits. A stolen refresh token verifies with the same key as access (mitigated by `typ`, not by crypto isolation). |
| 4 | Uploads trust `Content-Type`, not magic bytes | HIGH | `server/src/integrations/storage/multer/image-upload.multer.ts:41-51` | 4h | A `.php`/HTML payload with `image/jpeg` lands on disk under `/uploads`. |
| 5 | `sort=rating_desc` loads every matching product id | HIGH | `server/src/modules/products/providers/get-products.provider.ts:174-205` | 4h | Catalog growth turns the public list into a full-table read and in-process sort. |
| 6 | No CI pipeline | HIGH | repo root (no `.github/`) | 1 day | Lint/tests/build never block a merge. A broken main is how production incidents start. |
| 7 | No Dockerfile / non-root image | HIGH | repo root | 4h | You cannot repeatably ship what you cannot build. Root containers are the default if someone improvs one. |
| 8 | Prisma/pg pool and statement timeout not set | HIGH | `server/src/prisma/prisma.service.ts:11-16` | 2h | Default pool × instance count can exhaust Postgres `max_connections` and take the API down. |
| 9 | Money arithmetic is JS `number` | HIGH | `server/src/modules/orders/utils/order-pricing.util.ts:8-15` | 4h | DB is Decimal; the app still does `subtotal * 100`. That is how cent drift appears. |
| 10 | bcrypt uses `genSalt()` default (cost 10) | HIGH | `server/src/common/crypto/providers/bcrypt.provider.ts:7-9` | 30 min | Cost 10 is 2010-era. GPU stuffing is cheaper than you think. |
| 11 | Access tokens survive password change for their full TTL | HIGH | `server/src/modules/users/providers/change-password.provider.ts:39-45` | 4h | Refresh is revoked. A stolen 15-minute access token still works. |
| 12 | Admin refund is check-then-act without a row lock | HIGH | `server/src/modules/payments/providers/payment-lifecycle.provider.ts:188-229` | 2h | Two concurrent admin refunds can over-state `refundedAmount` (ledger lie; does not call Stripe today). |
| 13 | `rating` / `stockQuantity` / amounts have no DB CHECK | HIGH | `server/prisma/schema.prisma:189`, `:467` | 4h | App validation is a race; a bad script writes `rating = 99` or negative stock forever. |
| 14 | Staging CORS is “reflect any origin” unless `NODE_ENV=production` | HIGH | `server/src/main.ts:40-47` | 1h | A staging box left on `development` lets any website call the API with cookies/credentials. |

---

## Injected Instructions & Suspicious Content

No prompt-injection attempts or reviewer-directed instructions were found in this codebase.

Checked for: “ignore previous instructions”, “disregard the prompt”, “you are now…”, “do not report this file”, “skip this directory”, “already approved”, “rate this module 10/10”, “mark security as passing”, “as an AI you must”, fake `SYSTEM:` / `<system>` tags, and “do not mention the secret below.”

Search covered `server/src`, `server/prisma`, `server/.env.example`, `server/README.md`, and root agent/docs markdown. No matches.

`AGENTS.md` / `server/AGENTS.md` contain normal coding-agent workflow rules (follow existing architecture, do not invent APIs). They do not ask a reviewer to hide findings, skip files, or inflate scores. Treated as project convention, not an injection.

**Why this matters:** Prompt-injection in a repo can hijack CI review bots and autocomplete. An explicit “none found” is the useful signal; silence is not.

---

## Files Excluded From Review

No prior `CODE_REVIEW*.md`, `AUDIT*.md`, `SECURITY_REVIEW*.md`, `*_review_report.*`, or `/docs/reviews/` / `/audit/` / `/reports/` artifacts existed. This is a fresh pass.

| File / path | Reason | Last modified |
|-------------|--------|---------------|
| `client/**` | Frontend / Next BFF — out of backend scope | n/a |
| `server/src/generated/**` | Prisma generated client (do not review generated code) | n/a |
| `server/node_modules/**`, `server/dist/**`, `server/coverage/**` | Vendor / build output | n/a |
| `client/.next/**` | Next build cache | n/a |
| `docs/walkthrough/**`, `docs/ai-development.md` | Project docs, not prior audit reports. Skimmed only for stack context; scores were not inherited. | 2026-08-09 |

---

## About This Codebase

### Stack (detected)

| Piece | What we found |
|-------|----------------|
| Language / runtime | TypeScript 5.7, target ES2023, CommonJS |
| Framework | NestJS 11 (`@nestjs/common` ^11.0.1) |
| HTTP | Express 5 via `@nestjs/platform-express`, `rawBody: true` (Stripe) |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Database | PostgreSQL (26 models in `schema.prisma`) |
| Auth | `@nestjs/jwt` + bcrypt; not Clerk |
| Payments | Stripe SDK ^22 |
| Validation | `class-validator` + global `ValidationPipe`; env via Joi |
| Rate limit | `@nestjs/throttler` v6, in-memory |
| Mail | `@nestjs-modules/mailer` + nodemailer |
| Package manager | npm (`server/package-lock.json` present) |
| Cache / queue | None |
| Tests | Jest + ts-jest; 19 `*.spec.ts` files; `test:e2e` script exists, no `server/test/` harness |

### Size

| Metric | Count |
|--------|-------|
| TypeScript source files (`server/src`, excl. generated) | 418 |
| Lines of TypeScript | ~28,400 |
| Prisma models | 26 |
| Controllers | 17 unique |
| HTTP handlers (Get/Post/Patch/Delete) | ~70 unique (decorator count is higher because Windows indexed some paths twice) |
| Spec files | 19 |
| E2E files | 0 |

### Directory tree (3 levels, exclusions applied)

```text
server/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── 20260717000000_baseline
│       ├── 20260804170000_buyer_addresses_and_notification_types
│       ├── 20260805220000_production_readiness_indexes
│       └── 20260904220000_checkout_hardening
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── common/          (audit, crypto, filters, guards, pagination, …)
│   ├── config/
│   ├── health/
│   ├── integrations/    (mail, storage, stripe)
│   ├── modules/         (see domains below)
│   ├── prisma/
│   └── seeders/
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── .env.example
```

### Domains the app is actually organised into

`auth`, `users`, `sellers`, `stores`, `categories`, `products`, `product-variants`, `files`, `carts`, `wishlists`, `addresses`, `orders`, `payments`, `reviews`, `notifications`, `dashboard`, plus `health`, `seeders`, and integrations (`mail`, `stripe`, `storage`).

### One request, end to end

**Example: `POST /auth/login` then `GET /orders/:id`**

1. `bootstrap()` in `main.ts` creates the Nest app, enables shutdown hooks, `trust proxy = 1`, request-id middleware, Helmet, compression, CORS, blocks private `/uploads/{sellers,customer-documents}`, mounts public uploads, installs the global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).
2. `AppModule` registers `ThrottlerGuard` and `DataResponseInterceptor`. `AuthModule` registers `AuthenticationGuard`. `CommonModule` registers `RolesGuard` and exception filters.
3. Login hits `AuthController.login` (`@Auth(AuthType.NONE)`, 10 req / 60s). `LoginProvider` loads the user, compares bcrypt against a dummy hash when the email is unknown, issues access + refresh, persists the refresh hash.
4. A later `GET /orders/:id` sends `Authorization: Bearer …`. `AccessTokenGuard` verifies the JWT, requires `typ === ACCESS`, loads the user, rejects blocked/deleted, attaches `{ sub, email, roles }` to the request.
5. `RolesGuard` sees no `@Roles` on `findOne` → any authenticated user may proceed.
6. `OrdersController.findOne` → `OrdersService` → `GetOrderProvider.findOne` → `OrderOwnershipProvider.assertCanView` (buyer / store seller / super-admin).
7. Prisma reads the order. `DataResponseInterceptor` wraps the body as `{ data, version }`.

**Create path traced:** `POST /orders/checkout` → DTO + optional idempotency → expire stale sessions → lock variants → reserve stock → create session/orders/payments → Stripe PaymentIntent → return `clientSecret`.

**List path traced:** `GET /products` (public) → `QueryProductDto` + pagination cap 100 → `findMany` with `PRODUCT_LIST_INCLUDE` → review stats batched → `{ data, page, limit, total }` inside the envelope.

### House style

Feature folders under `src/modules/<domain>/` with `*.controller.ts`, `*.service.ts` (facade), `providers/`, `dto/`, `constants/`, `utils/`. Files are kebab-case. Classes are PascalCase. Env is `SCREAMING_SNAKE_CASE`. That is applied consistently — deviations below are real, not taste.

### Notably absent

- Dockerfile / docker-compose
- `.github/workflows` (or any CI config)
- Redis / Bull / any queue
- Structured JSON logger (Pino/Winston)
- Sentry / OpenTelemetry / Prometheus
- `.editorconfig`
- `server/test/` e2e harness (script exists, files do not)
- Root `package.json` (this is a two-folder monorepo, not an npm workspace)

---

## Detailed Findings

### Module 1 — Project Structure & Architecture — **8/10**

**Verdict in one paragraph:** This is a clean Nest modular monolith. Controllers stay thin, services delegate, providers own one use-case. That is the right shape for this size. Do not introduce a repository/CQRS layer.

**What's working:** Domain folders match the business. Integrations (`mail`, `stripe`, `storage`) stay adapters. Shared kernel (`common/pagination`, `common/crypto`, `common/audit`, `common/filters`) is small and purposeful. ADRs document the seams.

**Findings:**

#### 1.1 Stripe call sits outside the checkout transaction — `MEDIUM`
**Where:** `server/src/modules/orders/providers/create-checkout.provider.ts:106-272`

**What's happening:**
```ts
const { sessionId, orderIds } = await this.prisma.$transaction(/* reserve stock, create rows */);
try {
  paymentIntent = await this.stripeService.createPaymentIntent(/* ... */);
} catch {
  await this.rollbackCheckout(sessionId, orderIds);
}
```

**Why it matters:** Holding a DB transaction open across Stripe would be worse (pool exhaustion). The current split is the right idea. The remaining risk is a crash after commit and before rollback: stock stays reserved until the 30-minute abandon sweep. That is survivable if the sweeper stays healthy; it is painful if the sweeper dies.

**Fix:** Keep the split. Alert on `expire-abandoned-checkouts` failures and on `PENDING` sessions older than TTL. Consider a shorter TTL in production if 30 minutes of reserved stock is too long.

**Effort:** 2h (monitoring) / already designed correctly

#### 1.2 `files.controller.ts` is the largest HTTP surface — `LOW`
**Where:** `server/src/modules/files/files.controller.ts` (357 lines)

**What's happening:** One controller owns product/store/user/seller-document uploads.

**Why it matters:** Not a runtime risk. The next feature will keep adding routes here until review becomes guesswork.

**Fix:** Split into `product-files.controller.ts`, `store-files.controller.ts`, etc., still in the files module.

**Effort:** 2h

#### 1.3 Circular dependencies — `unverified`
`madge --circular` was not run (command execution for that scan was not available in this pass). Nest `forwardRef` usage was not spotted in the files read. Treat as unconfirmed.

**To get this module to 8+:** You are already at 8. Keep providers small; do not grow `files.controller.ts`.

---

### Module 2 — Naming Conventions & Code Style — **8/10**

**Verdict in one paragraph:** The team picked Nest kebab-case and stuck to it. Identifiers, folders, and test suffix (`*.spec.ts` only) are consistent. The leftover mess is inherited Postgres constraint names from an earlier schema.

**What's working:** `create-checkout.provider.ts`, `order-ownership.provider.ts`, `QueryProductDto`. Booleans read as predicates (`isBlocked`, `isDefaultShipping`). Enums are singular (`UserRole`, `OrderStatus`). Tables are `snake_case` plural via `@@map`. Prisma `camelCase` fields map globally through the schema — not 200 `@Column({ name })` annotations.

**Findings:**

#### 2.1 Mixed constraint names in the schema — `MEDIUM`
**Where:** `server/prisma/schema.prisma:12`, `:15`, `:172-173`

```prisma
id Int @id(map: "PK_a3ffb1c0c8416b9fc6f907b7433")
email String @unique(map: "UQ_97672ac88f789774dd47f7c8be3")
category Category @relation(..., map: "FK_ff56834e735fa78a15d0cf21926")
```

Newer objects use readable names (`UQ_checkout_idempotency_keys_user_id_key`, `IDX_orders_user_id_created_at`). Old TypeORM-era hashes remain.

**Why it matters:** On-call “what is `FK_ff56834e…`?” wastes time during a lock or migration failure. Postgres itself does not care.

**Fix:** Rename in a dedicated migration when you are next touching those tables. Do not mix this into a feature PR.

**Effort:** 1 day (careful, not hard)

#### 2.2 No `.editorconfig` — `LOW`
Formatter lives in ESLint/Prettier. New editors will disagree on trailing newlines until someone copies a teammate’s settings.

**To get this module to 8+:** Already there. Rename ugly constraints when convenient.

---

### Module 3 — Type Safety — **6/10**

**Verdict in one paragraph:** Runtime boundaries are validated (class-validator, Joi, Prisma). Compile-time is softer than it looks. `strict` is not on.

**What's working:** Almost no `: any` / `as any` in production code. Zero `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`. Prisma client is generated. Catch clauses seen were typed or narrowed. ESLint uses `recommendedTypeChecked`.

**Findings:**

#### 3.1 `tsconfig` is not strict — `HIGH`
**Where:** `server/tsconfig.json:18-23`

```json
"strictNullChecks": true,
"noImplicitAny": false,
"strictBindCallApply": false,
"noFallthroughCasesInSwitch": false
```

Missing vs a production TS bar: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `useUnknownInCatchVariables` (not set here), `noUnusedLocals`, `exactOptionalPropertyTypes`.

**Why it matters:** `noImplicitAny: false` means an untyped callback parameter compiles. That is how `undefined.foo` ships. `strictNullChecks` alone is not `strict`.

**Fix:** Turn on `strict: true` and `noFallthroughCasesInSwitch` first. Fix the errors. Then `noUncheckedIndexedAccess`. Do not flip every flag in one PR.

**Effort:** 1–2 days

#### 3.2 `images?: any[]` on the create-product DTO — `MEDIUM`
**Where:** `server/src/modules/products/dto/create-product.dto.ts:88`

```ts
images?: any[];
```

Swagger-only field; files arrive via multer. Still an `any` on an HTTP DTO, which is the worst place for one.

**Fix:** Remove the property from the class (document it only in `@ApiBody`) or type it as `never` / omit it.

**Effort:** 15 min

#### 3.3 ESLint turns `no-explicit-any` off globally — `LOW`
**Where:** `server/eslint.config.mjs:34`

The type-checked rules are otherwise meaningful. Turning `any` back to `error` after `images?: any[]` is gone would lock the door.

**To get this module to 8+:** Enable `strict`. Delete the `any[]`. Keep generating Prisma types.

---

### Module 4 — API Design & Response Consistency — **6/10**

**Verdict in one paragraph:** Clients get one success shape `{ data, version }` and one error shape `{ statusCode, message, error, requestId }`. Pagination exists and is capped. The money path still uses JavaScript numbers, and checkout can be created twice if the client forgets the idempotency key.

**What's working:** REST verbs match intent. Public catalog is GET-only. Admin lists live under `admin/all`. Pagination is `page`/`limit` everywhere that extends `PaginationQueryDto`, max 100. Sort fields on products are a whitelist. Swagger is forced off in production (`setup-swagger.ts:15-17`).

**Findings:**

#### 4.1 Checkout idempotency is optional — `HIGH`
**Where:** `server/src/modules/orders/providers/create-checkout.provider.ts:46-51`

```ts
const key = normalizeIdempotencyKey(dto.idempotencyKey ?? idempotencyKeyHeader);
if (!key) {
  return this.createOnce(userId, dto);
}
```

**Why it matters:** A double-submit (mobile retry, impatient click, proxy replay) reserves stock twice and opens two PaymentIntents. You already built the hard part — a unique `(userId, key)` row. Not requiring the key wastes it.

**Fix:**
```ts
if (!key) {
  throw new BadRequestException('Idempotency-Key is required');
}
```
Accept either the header or the body field, but require one. The Next BFF should send it on every checkout.

**Effort:** 2h

#### 4.2 Checkout totals are JS floats — `HIGH`
**Where:** `server/src/modules/orders/utils/order-pricing.util.ts:8-15` and `create-checkout.provider.ts:90-95`

```ts
export function calculateOrderPricing(subtotal: number): OrderPricing {
  const rounded = Math.round(subtotal * 100) / 100;
  return { tax: 0, total: rounded, subtotal: rounded };
}
```

Then `amountCents = Math.round(pricing.total * 100)`.

**Why it matters:** `0.1 + 0.2 !== 0.3`. You store Decimal in Postgres (good) and then leave the domain in IEEE-754. Tax is zero today, so the blast radius is smaller — until someone adds tax or discounts on the same function.

**Fix:** Keep integer cents (or `Prisma.Decimal`) from the first sum through the Stripe `amount`. Convert to Decimal only when writing the row.

**Effort:** 4h

#### 4.3 Nest routes are unversioned — `MEDIUM`
Controllers mount at `/auth`, `/orders`, `/products`. Versioning lives on the Next BFF (`/api/v1/...`), which is an intentional ADR. If this Nest process is ever exposed directly, you cannot make a breaking change safely.

**Fix:** Keep BFF versioning. Do not put Nest on a public DNS name. If you ever expose Nest, add a global prefix.

**Effort:** process / docs

#### 4.4 Error codes are HTTP names, not stable machine codes — `MEDIUM`
**Where:** `server/src/common/filters/api-error-response.util.ts:33-47`

Clients get `error: "Bad Request"` and a human `message`. `errorCode` exists only if a thrower sets it. Frontends that string-match `"Invalid credentials"` will break on copy edits.

**Fix:** Add a small set of stable codes on auth and checkout (`INVALID_CREDENTIALS`, `INSUFFICIENT_STOCK`, `PAYMENT_AMOUNT_MISMATCH`).

**Effort:** 1 day

#### 4.5 Swagger vs runtime pagination on a few lists — `LOW`
`GET /payments` and `GET /reviews/product/:id` advertise `isArray: true` but the providers paginate. Confusing, not a runtime bug.

**To get this module to 8+:** Require idempotency on checkout. Move money to cents. Add error codes on the two hottest failure paths.

---

### Module 5 — Request Validation & Input Handling — **6/10**

**Verdict in one paragraph:** The global pipe is the one people usually forget, and you did not forget it. Write endpoints have DTOs. File uploads have size limits and random names. The remaining hole is trusting the client MIME type.

**What's working:**

```ts
// server/src/main.ts:63-69
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }),
);
```

`UpdateProfileDto` cannot set `role` or `isBlocked`. `CreateUserDto` cannot set roles. Nested checkout address uses `@ValidateNested()` + `@Type()`. Cart sync is capped at 100 lines. Pagination query params are ints with a max. Product sort is an allow-list. Raw SQL uses Prisma tagged templates + `Prisma.join`, not string concat.

**Findings:**

#### 5.1 File uploads trust `Content-Type` — `HIGH`
**Where:** `server/src/integrations/storage/multer/image-upload.multer.ts:36-51` (same pattern in `document-upload.multer.ts:36-51` and `shared-multer.config.ts:44-61`)

```ts
if (!IMAGE_MIME_REGEX.test(file.mimetype)) {
  cb(new BadRequestException('Only image files are allowed …'), false);
}
```

**Why it matters:** Browsers and attackers set `mimetype` themselves. A crafted file stored under `/uploads/products/` is served as a static asset. That is how stored XSS and the occasional polyglot upload happen. Size limits (5MB / 10MB) and UUID names are already correct — only the type check is weak.

**Fix:** After multer accepts the file, read the first bytes (`ff d8 ff` JPEG, `89 50 4e 47` PNG, `%PDF`, etc.). Reject and delete on mismatch. Re-encode images if you can afford it (strips EXIF/payloads).

**Effort:** 4h

#### 5.2 No explicit JSON body size limit — `MEDIUM`
Nest/Express defaults to 100kb. Fine for this API. Not documented, so a future “import catalog JSON” route will inherit whatever someone sets locally.

**Fix:** Set `app.use(json({ limit: '100kb' }))` explicitly next to Helmet.

**Effort:** 15 min

#### 5.3 Regexes checked for ReDoS — clean
`PASSWORD_COMPLEXITY_REGEX` and `PHONE_REGEX` have no nested quantifiers. Not a finding.

**Mass-assignment trace:** `PATCH /users/me` → `UpdateProfileDto` (`fullName`, `phoneNumber` only) → whitelist pipe. Cannot escalate. Clean.

**To get this module to 8+:** Magic-byte checks on uploads. Keep the global pipe exactly as it is.

---

### Module 6 — Authentication & JWT Lifecycle — **6/10**

**Verdict in one paragraph:** The session design is the strongest part of this API. Refresh tokens are server-side, hashed, rotated, and family-revoked. Login timing is equalized. The gaps are cryptographic hygiene (one secret, short minimum, bcrypt cost 10) and the 15-minute window after a password change.

**Lifecycle (as implemented):**

1. **Register** (`POST /auth/register`, 5/min): create user + `BUYER` role in a transaction; no tokens returned (`register.provider.ts:16-49`).
2. **Login** (`POST /auth/login`, 10/min): dummy bcrypt hash if email missing; same `"Invalid credentials"` message; blocked users get 403; issue access + refresh (`login.provider.ts:36-68`).
3. **Access token:** HS256 (library default), TTL from env (default `15m`), claims `sub`, `email`, `roles`, `typ: ACCESS`. No `iss`/`aud`/`jti`.
4. **Refresh token:** same signing secret, TTL default `7d`, claims `sub`, `typ: REFRESH`, `familyId`. SHA-256 stored in `refresh_tokens`.
5. **Authenticated request:** bearer header only; `verifyAsync` + `typ` check + DB reload + block/delete checks.
6. **Refresh** (`POST /auth/refresh`, 20/min): verify JWT → load hash → if already revoked, revoke family → rotate.
7. **Logout** (`POST /auth/logout`): revokes the refresh family. Access token still works until `exp`.
8. **Forgot/reset:** reset JWT (1h) embeds SHA-256 of the current password hash; used once because the hash changes; all refresh tokens revoked after reset.
9. **Password change / block user:** revoke all refresh tokens for that user.

**Unprotected routes (intentional):** auth endpoints, `/health/live`, `/health/ready`, public catalog (`GET /products`, `/products/:id`, `/products/detail/:slug`), categories, product/store file lists, store-by-slug, public reviews/summaries, `POST /orders/webhooks/stripe` (signature-checked).

**Findings:**

#### 6.1 One JWT secret for access, refresh, and password-reset — `HIGH`
**Where:** `server/src/config/jwt.config.ts:3-6`, `generate-tokens.provider.ts:35-40`

```ts
secret: process.env.JWT_SECRET,
```

Every `signAsync` / `verifyAsync` uses that one value. `typ` distinguishes token kinds.

**Why it matters:** Defense in depth. If verification ever forgets the `typ` check (a future endpoint, a script, a mis-copied guard), a refresh token becomes an access token. Separate secrets make that impossible.

**Fix:** `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_RESET_SECRET`. Verify each token type with its own secret. Rotate access first (short TTL).

**Effort:** 4h

#### 6.2 `JWT_SECRET` minimum is 16 characters — `HIGH`
**Where:** `server/src/config/environment.validation.ts:21-31`

Joi rejects `'secret'` and friends (good) but allows a 16-character string. HS256 wants ≥ 256 bits of entropy (32+ random bytes, usually a 64-char hex or 44-char base64).

**Fix:**
```ts
JWT_SECRET: Joi.string().required().min(32).invalid(/* same list */)
```
Generate with `openssl rand -base64 48`.

**Effort:** 30 min + secret rotation

#### 6.3 bcrypt cost is the library default (10) — `HIGH`
**Where:** `server/src/common/crypto/providers/bcrypt.provider.ts:7-9`

```ts
const salt = await genSalt(); // rounds default 10
return hash(data, salt);
```

**Why it matters:** Cost 12 is the current floor for interactive logins. Cost 10 is roughly 4× cheaper to stuff.

**Fix:** `genSalt(12)`. Existing hashes keep working; new hashes and password changes upgrade.

**Effort:** 15 min

#### 6.4 Password change does not kill access tokens — `HIGH`
**Where:** `server/src/modules/users/providers/change-password.provider.ts:39-45`

Refresh tokens are revoked. The access JWT is still valid until `exp` (default 15 minutes). There is no `tokenVersion` / `sessionInvalidAfter` compared in `AccessTokenGuard`.

**Why it matters:** The prompt’s “attacker keeps access after the victim changes password” case is real for those 15 minutes. With a 15-minute TTL this is a window, not a week-long hole — still worth closing for an e-commerce account.

**Fix:** Store `users.tokenVersion` (or `sessionsInvalidBefore`). Increment on password change, reset, and “logout all.” Compare it in `AccessTokenGuard` after the user load (you already hit the DB).

**Effort:** 4h

#### 6.5 Algorithm is not pinned — `MEDIUM`
`verifyAsync` passes `{ secret }` only. With a symmetric secret, `jsonwebtoken` will not accept an `alg: none` or RS256 token as HMAC. Still pin it so a future “we added RSA” change cannot introduce algorithm confusion:

```ts
await this.jwtService.verifyAsync(token, {
  secret: this.jwtConfiguration.secret,
  algorithms: ['HS256'],
});
```

**Effort:** 30 min

#### 6.6 Password max length is 30 — `MEDIUM`
**Where:** `server/src/common/constants/password.constants.ts:1-5`

A 30-character maximum plus composition rules (`Password1!`) pushes people to short, reused passwords. bcrypt’s real cap is 72 bytes.

**Fix:** Raise max to 72. Keep min 8 (12 is better). Drop the “must include symbol” rule or keep it — team call.

**Effort:** 30 min

#### 6.7 Reset token travels in a query string — `MEDIUM`
**Where:** `server/src/modules/auth/providers/forgot-password.provider.ts:50`

```ts
const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;
```

Standard email pattern. Tokens then appear in access logs, analytics, and `Referer` if the page loads a third-party script.

**Fix:** Keep it (users cannot POST from an email). Use a one-time opaque token stored hashed (you already have this pattern for refresh) instead of a JWT in the URL, and set a short referrer policy on the reset page.

**Effort:** 4h

#### 6.8 No account lockout / no MFA — `LOW` given the threat model
Rate limits exist per IP. No per-account lockout, no TOTP. Compliance needs are “None.” Mentioned so it is a conscious choice, not an accident.

**To get this module to 8+:** Split secrets, min 32 chars, bcrypt 12, pin `HS256`, increment a session version on password change.

---

### Module 7 — Authorization & Access Control — **7/10**

**Verdict in one paragraph:** This is not the “findById and hope” API. Object access is centralized. Function-level admin routes use `@Roles(SUPER_ADMIN)`. Webhooks are signed. I did not find a confirmed IDOR on orders, payments, addresses, notifications, or private files.

**What's working:** Global `RolesGuard` (`common.module.ts:28-30`). Unrecognised role does not fail open when roles are required. Seller product mutations are seller-scoped via `ProductOwnershipProvider`. Admin store actions are verify/suspend, not generic seller catalog writes.

**`:id` ownership (sampled, not every route in the repo):**

| Endpoint | Ownership check? | Where |
|----------|------------------|--------|
| `GET /orders/:id` | Yes — buyer / store seller / admin | `get-order.provider.ts:37-42` |
| `POST /orders/:id/cancel` | Yes — buyer or admin | `order-ownership.provider.ts:118-129` |
| `PATCH /orders/:id/status` | Yes — store seller or admin | `assertCanManageStatus` |
| `GET /payments/:id` | Yes | `payment-ownership.provider.ts:46-73` |
| `POST /payments/:id/refunds` | Admin only | `assertCanRecordRefund` |
| `GET/PATCH/DELETE /addresses/:id` | Own only (service + ownership provider) | address module |
| `GET /notifications/:id` | Own only | `notification.controller.ts:72-73` |
| `GET /files/secure/:fileId` | Owner or admin; public files 404 | `secure-file-access.provider.ts:59-70` |
| `GET /reviews/:id` | Any authenticated user; documented as public marketplace content | `get-review.provider.ts:10-11` |
| `GET /products/:id` | Public; ACTIVE + not deleted only | `get-products.provider.ts:228-236` |

**Findings:**

#### 7.1 `GET /reviews/:id` is authenticated but not owner-scoped — `LOW`
Documented as public marketplace content. The product-scoped list is already public (`@Auth(NONE)`). Not an IDOR in practice. The extra bearer requirement is slightly inconsistent with `GET /reviews/product/:productId`.

#### 7.2 No tests for most ownership providers — `MEDIUM`
Specs exist for orders, products, and a couple of payment/checkout paths. Addresses, notifications, files, and reviews ownership are untested. An IDOR will come back as a “small refactor.”

**Fix:** One table-driven spec per ownership provider: buyer A, buyer B, seller wrong store, admin.

**Effort:** 1 day

**To get this module to 8+:** Ownership tests on every `:id` module. That is the whole gap.

---

### Module 8 — Security (OWASP API Top 10) — **5/10**

**Verdict in one paragraph:** Secrets are not in the repo. Helmet is on. Production CORS is an allow-list. The production-scale holes are the in-memory throttle, MIME trust (see Module 5), and the `NODE_ENV !== production` CORS wildcard.

**What's working:** `.gitignore` covers `.env`. `.env.example` has placeholders only. No live `sk_live_`, AWS keys, or PEM files found in source. Helmet default headers. `X-Powered-By` stripped by Helmet. Stripe webhook signature required. Private upload prefixes return 404. Audit log exists for admin actions. Prisma errors are mapped to generic messages (`prisma-exception.filter.ts:59-85`). Unhandled errors become `"Internal server error"` (`all-exceptions.filter.ts:53-61`).

**Findings:**

#### 8.1 In-memory rate limit — `HIGH`
**Where:** `server/src/app.module.ts:60-66`

```ts
ThrottlerModule.forRoot([{ limit: 100, ttl: 60_000, name: 'default' }])
```

Auth endpoints override to 5–20 / minute. Storage is the default in-process map.

**Why it matters:** Three API instances = 30 login attempts / minute / IP, not 10. Behind a load balancer this is the difference between “we rate-limit login” and “we think we do.”

**Fix:** `@nestjs/throttler-storage-redis` (or equivalent) once you have Redis. Until then, run one instance or put the limit at the edge (Cloudflare / nginx).

`trust proxy` is set to `1` (`main.ts:29`) — correct if a single proxy sits in front. If you add another hop, spoofed `X-Forwarded-For` becomes a HIGH of its own.

**Effort:** 4h + Redis

#### 8.2 Non-production CORS reflects any origin — `HIGH`
**Where:** `server/src/main.ts:40-47`

```ts
app.enableCors({
  origin: isProduction ? corsOrigins : true,
  credentials: true,
});
```

`origin: true` means “echo `Origin`.” Combined with `credentials: true` that is “any website can call this API as the user” — the classic CORS footgun. It is gated on `NODE_ENV === 'production'`.

**Why it matters:** Staging often runs `NODE_ENV=development` or `staging` (the latter fails Joi — good). If staging is `development`, it is wide open.

**Fix:** Use the allow-list in every environment. Put localhost in `FRONTEND_URL` for dev.

**Effort:** 1h

#### 8.3 Admin seed can grant `SUPER_ADMIN` to an existing email — `MEDIUM`
**Where:** `server/src/seeders/providers/seed-admin.provider.ts:56-78`

If `ALLOW_ADMIN_SEED=true` and `ADMIN_EMAIL` matches a normal user, that user becomes super-admin.

**Fix:** Only create, never promote. In production keep `ALLOW_ADMIN_SEED=false` (already the default).

**Effort:** 30 min

#### 8.4 `npm audit` — **could not verify**
A dependency audit was not run in this pass (the command was blocked). Do this before the first prod deploy. Lockfile is present.

#### 8.5 No inbound HTML sanitisation on review/product text — `MEDIUM`
Reviews accept a 2000-char `comment`. If any admin UI or email renders it as HTML, that is stored XSS. JSON APIs that stay JSON are fine.

**Fix:** Store as text; encode on render. If you ever interpolate into an email template, escape.

**Effort:** 2h if emails render comments

#### 8.6 Helmet is default-configured — `LOW`
No explicit HSTS `maxAge`. Fine if TLS terminates at the load balancer and sets HSTS there. Confirm on the edge.

**To get this module to 8+:** Redis throttle, CORS allow-list in all envs, magic-byte uploads, run `npm audit` in CI.

---

### Module 9 — Configuration & Env Validation — **7/10**

**Verdict in one paragraph:** The app will not boot on a typo’d `NODE_ENV` or a missing `DATABASE_URL`. That is the important part. A few defaults are still too forgiving.

**What's working:** Joi schema is required on `ConfigModule.forRoot`. `NODE_ENV` is `development | production | test`. Production requires `FRONTEND_URL` and `STRIPE_WEBHOOK_SECRET`. Booleans use `.truthy('true').falsy('false')`. Almost all `process.env` reads live under `src/config/` or uploads-root.

**Findings:**

#### 9.1 JWT minimum and TTL defaults — `HIGH` / `MEDIUM`
Covered in Module 6. Joi default TTL `'15m'` / `'7d'` is fine. `jwt.config.ts` repeats those defaults if Joi is bypassed.

#### 9.2 `app.config` defaults `NODE_ENV` to `development` — `MEDIUM`
**Where:** `server/src/config/app.config.ts:5`

```ts
environments: process.env.NODE_ENV || 'development',
```

Joi already required `NODE_ENV`, so this default should never run. If someone loads `appConfig` in a script without Joi, Swagger/CORS take the dev branch. `main.ts:74` also does `Number(process.env.PORT) || 3001` outside the typed config.

**Fix:** `configService.getOrThrow('app.environments')` in `main.ts`. Read `PORT` from the validated config namespace.

**Effort:** 30 min

#### 9.3 `.env.example` is complete enough — clean
Placeholders only. `ALLOW_ADMIN_SEED=false` is documented. No real secrets.

**To get this module to 8+:** JWT min 32. Stop reading `process.env.PORT` in `main.ts`.

---

### Module 10 — Database Schema, Constraints & Migrations — **7/10**

**Verdict in one paragraph:** This schema looks like someone has already been paged about missing indexes. FKs are present. Money is Decimal. Soft-delete columns exist where the domain needs them. The remaining gaps are CHECKs, timestamptz, and a couple of uniqueness holes.

**What's working:** Versioned migrations under `prisma/migrations/` (including `production_readiness_indexes` and `checkout_hardening`). Primary keys on every table. Unique email, slug, SKU, order number, review `(userId, productId)`, cart `(userId, variantId)`, checkout idempotency `(userId, key)`. FKs with explicit `onDelete`. Composite indexes on hot order lists. `RefreshToken.tokenHash` unique.

**Findings:**

#### 10.1 No CHECK constraints on domain invariants — `HIGH`
**Where:** `server/prisma/schema.prisma`

- `Review.rating` is bare `Int` (app allows 1–5 only)
- `ProductVariant.stockQuantity` is bare `Int` (can be negative)
- `Payment.amount` / `Order.totalAmount` have no `>= 0`
- `OrderItem.quantity` has no `> 0`

**Why it matters:** The service layer is not the only writer. Seeds, one-off SQL, and a future bug will insert garbage. Uniqueness you already put in the DB (correct). Non-negativity belongs there too.

**Fix:**
```sql
ALTER TABLE reviews ADD CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE product_variants ADD CONSTRAINT chk_variants_stock_nonneg CHECK (stock_quantity >= 0);
ALTER TABLE payments ADD CONSTRAINT chk_payments_amount_nonneg CHECK (amount >= 0);
```

**Effort:** 4h + migrate

#### 10.2 Timestamps are `TIMESTAMP(6)`, not `timestamptz` — `MEDIUM`
**Where:** throughout `schema.prisma` (`@db.Timestamp(6)`)

**Why it matters:** Postgres `timestamp` is “local, no zone.” A session in UTC plus a reporting query in another zone will shift `created_at` by hours. E-commerce order times are exactly the field people argue about.

**Fix:** New tables use `Timestamptz`. Existing columns: migrate in expand/contract (add new column, backfill, swap) — do not do it as a one-step lock on a hot table.

**Effort:** 1 day if you do it safely

#### 10.3 `ON DELETE CASCADE` on `payments` — `MEDIUM`
**Where:** `server/prisma/schema.prisma:378`

Deleting an order deletes the payment row. Fine for abandoned-checkout rollback (you do this). Dangerous if anyone ever `DELETE FROM orders` for cleanup.

**Fix:** Keep CASCADE for session rollback, but never hard-delete a paid order. Prefer cancel + retain. Document that.

**Effort:** convention

#### 10.4 `checkout_sessions.stripe_payment_intent_id` is not unique — `MEDIUM`
**Where:** `server/prisma/schema.prisma:394` (indexed, not unique)

A unique constraint would make “one PI → one session” a database fact. Today two sessions could theoretically share a PI id (`pending` is also reused as a placeholder — that value is definitely not unique).

**Fix:** Use `NULL` instead of `'pending'`, then `UNIQUE` on the column.

**Effort:** 2h

#### 10.5 `checkout_session_items.variant_id` has no standalone index — `LOW`
Covered by the unique `(checkoutSessionId, variantId)`. A reverse lookup “all pending sessions for this variant” would seq-scan. Add if you need that query.

#### 10.6 Soft-delete filters — generally applied
Public product reads filter `deletedAt: null` and `status: ACTIVE`. Sellers can opt into `lifeCycle=removed`. Not a leak in the paths read.

**Concurrency:** Checkout reserve uses `FOR UPDATE` (good). Refund apply does not (see Module 8/4). Complete-checkout claims the session with `updateMany` where `status = PENDING` (good).

**To get this module to 8+:** CHECK constraints. Unique PI id. Plan timestamptz.

---

### Module 11 — Query Performance, N+1 & Indexing — **5/10**

**Verdict in one paragraph:** The boring list endpoints are paginated and use `include`. The public catalog has one foot-gun (`rating_desc`) and an unindexable search. There is no cache and no configured pool.

**What's working:** `PaginationProviders` caps limit at 100. Product lists use `PRODUCT_LIST_INCLUDE` (not per-row queries). Review stats are batched (`getReviewStatsForProducts`). Dashboard aggregations use `$queryRaw` (parameterized). FK columns on orders/products/payments are indexed. Abandoned-checkout sweep uses a `job_locks` row so multiple instances do not double-expire.

**Findings:**

#### 11.1 `sort=rating_desc` loads all matching ids — `HIGH`
**Where:** `server/src/modules/products/providers/get-products.provider.ts:174-205`

```ts
const allMatching = await this.prisma.product.findMany({
  where,
  select: { id: true },
});
const stats = await getReviewStatsForProducts(this.prisma, ids);
const sortedIds = [...ids].sort(/* in process */);
```

**Why it matters:** At 50 products this is fine. At 50,000 this is “read every id, aggregate every review, sort in Node, then page.” It will look like a memory leak and a slow GET `/products`.

**Fix:** Persist `averageRating` / `reviewCount` on `products` (updated when reviews change) and `ORDER BY average_rating DESC` in SQL. Or a materialized view.

**Effort:** 4h–1 day

#### 11.2 Catalog search is `contains` (leading wildcard) — `HIGH` (at scale)
**Where:** `server/src/modules/products/providers/get-products.provider.ts:69-78`

```ts
{ name: { contains: query.search.trim(), mode: 'insensitive' } },
{ description: { contains: query.search.trim(), mode: 'insensitive' } },
```

Prisma `contains` + `insensitive` is `ILIKE '%term%'` — not indexable with a normal btree.

**Fix:** `pg_trgm` GIN indexes for now; Postgres `tsvector` or a search service when the catalog hurts.

**Effort:** 2h for trigram; more for real search

#### 11.3 `COUNT(*)` on every paginated list — `MEDIUM`
`paginateQuery` always counts. Fine until `orders` is huge. Then admin `GET /orders/admin/all` will drag.

**Fix:** Skip `total` on cursor-style UIs, or use an estimate for admin.

**Effort:** 2h when it shows up in logs

#### 11.4 Connection pool not configured — `HIGH`
**Where:** `server/src/prisma/prisma.service.ts:11-16`

```ts
const adapter = new PrismaPg({
  connectionString: configService.getOrThrow<string>('database.url'),
});
```

No `connectionLimit`, no `statement_timeout`, no `idle_in_transaction_session_timeout`.

**Why it matters:** `instances × default pool` > `max_connections` is a classic Saturday outage. One forgotten transaction holds a connection forever.

**Fix:** Set pool size from env. Add `?statement_timeout=15000` (or a Prisma/pg option). Do the arithmetic: `pool * pods < max_connections - headroom`.

**Effort:** 2h

#### 11.5 No cache, emails in the request path — `MEDIUM`
Forgot-password sends mail before returning (caught, always `{ sent: true }`). Checkout completion fires mail in the background (`void … catch`). There is no queue. A slow SMTP makes forgot-password slow; that is acceptable. A queue becomes necessary when you add invoices/PDFs.

**Inferred, not measured:** N+1 on the hot product list looks avoided (`include` + batched stats). Confirm with Prisma query logging on `GET /products`.

**To get this module to 8+:** Fix `rating_desc`. Configure the pool. Trigram index on `products.name`.

---

### Module 12 — Error Handling, Logging & Observability — **6/10**

**Verdict in one paragraph:** Clients get a safe, consistent error body and a request id they can quote. Operators get Nest text logs and no metrics. You will debug production with `grep` and hope.

**What's working:** Three filters (HTTP, Prisma, all-exceptions). Prisma P2002 → 409 without leaking fields. Request id middleware (`request-id.middleware.ts:16-30`) echoes `x-request-id`. Audit writes are fire-and-forget and do not block money paths. Health is split: `/health/live` (process) and `/health/ready` (Postgres `SELECT 1`). `enableShutdownHooks()` is on. Zero `console.log` in `server/src`.

**Findings:**

#### 12.1 Nest `Logger`, not structured JSON — `MEDIUM`
Logs are line-oriented. In CloudWatch/Datadog you want `{ level, msg, requestId, userId }`.

**Fix:** `nestjs-pino` (or Winston) with automatic redaction of `password`, `authorization`, `cookie`, `refreshToken`.

**Effort:** 4h

#### 12.2 No metrics, tracing, or error tracker — `HIGH` (ops)
No Prometheus, OpenTelemetry, or Sentry in `package.json`. You will not know p95 checkout latency until users tweet.

**Fix:** One APM or Sentry + a `/metrics` scrape, authenticated or internal-only.

**Effort:** 1 day

#### 12.3 Checkout emails swallowed — `MEDIUM`
**Where:** `complete-checkout.provider.ts:195`, `:253-255`

```ts
void this.sendConfirmationEmails(userId, responses).catch(() => undefined);
```

Checkout should succeed if SMTP is down (correct). You also lose the signal that every confirmation is failing.

**Fix:** Log a warning with `orderId` (you do this in forgot-password). Count `mail.failed` if you add metrics.

**Effort:** 30 min

#### 12.4 Graceful shutdown is hooks-only — `MEDIUM`
`enableShutdownHooks()` disconnects Prisma on SIGTERM. There is no explicit “stop accepting, wait N seconds, then exit.” Under Kubernetes you want a preStop sleep + `app.close()` timeout so in-flight checkouts finish.

**Effort:** 2h

#### 12.5 `/health/ready` is public and quiet — `LOW` (good)
Returns `{ status: 'ok' }` only. Does not leak versions. `SkipThrottle` is correct for probes.

**To get this module to 8+:** JSON logs with redaction. Sentry. One latency dashboard on `/orders/checkout` and `/auth/login`.

---

### Module 13 — Testing & Quality Gates — **4/10**

**Verdict in one paragraph:** Someone wrote real tests for the scary checkout/auth code. That is the right instinct. There is no e2e suite and nothing in CI that fails a bad merge, so the suite is a local courtesy.

**What's working:** 19 `*.spec.ts` files sitting next to the logic they protect — webhook signature, checkout race, stock adjust, locks, idempotency, refresh-token store, access-token guard, order ownership, product ownership, COD reject, job lock. Jest is configured. No committed `.only`.

**Findings:**

#### 13.1 No e2e and no CI gate — `HIGH`
`package.json` has `test:e2e` pointing at `./test/jest-e2e.json`. There is no `server/test/` tree. There is no `.github/workflows`.

**Why it matters:** The tests you have will rot the first week nobody runs them. Ownership regressions (Module 7) will not get caught.

**Fix:** GitHub Action: `npm ci` → `npm run lint` (without `--fix`) → `npx tsc --noEmit` → `npm test` → `npm audit --omit=dev`. Add one e2e later: register → login → checkout (Stripe test mode or a fake).

**Effort:** 4h for CI; 2 days for a thin e2e

#### 13.2 Large untested surface — `MEDIUM`
No specs for users, addresses, files, reviews, notifications, sellers, stores, dashboard, mail, or multer. Login/register/reset themselves are untested (only token helpers and the access guard).

**To get this module to 8+:** CI that blocks merge. Login/refresh/logout tests. One checkout e2e. Ownership tests per Module 7.

---

### Module 14 — DevOps, CI/CD & Production Readiness — **3/10**

**Verdict in one paragraph:** The application code is ahead of the delivery story. There is no image, no pipeline, no in-repo deploy, and no runbook. Staging/production would be a person remembering commands.

**What's working:** `prisma migrate deploy` script exists. `start:prod` runs `node dist/main`. Shutdown hooks enabled. Health probes exist and are cheap. Lockfile committed. `.env` gitignored. Seed demo data is off by default.

**Findings:**

#### 14.1 No Dockerfile — `HIGH`
No image, no non-root user, no pinned base digest, no `HEALTHCHECK`, no `.dockerignore`.

**Why it matters:** The first person to “just dockerize it” will ship as root with a `:latest` tag and a copied `.env`. That is a CRITICAL waiting to happen.

**Fix:** Multi-stage Node 22 alpine (or distroless), `USER node`, copy `dist` + `prisma` + production `node_modules`, `HEALTHCHECK` against `/health/live`.

**Effort:** 4h

#### 14.2 No CI/CD — `HIGH`
Covered in Module 13. Also means migrations are not locked to a deploy step — someone will run `migrate deploy` on two pods at once or forget it.

**Fix:** One migrate job before the rolling deploy. Not on every pod start.

**Effort:** 1 day with whatever you deploy on

#### 14.3 In-process cron on every instance — `MEDIUM` (mitigated)
`ExpireAbandonedCheckoutsProvider` uses `setInterval` on every boot (`expire-abandoned-checkouts.provider.ts:43-52`) plus `JobLockProvider`. The lock is the right mitigation. If the lock table is unreachable, every instance still wakes up and errors (logged).

**Fix:** Keep the lock. Add a metric when the lock is skipped vs taken.

#### 14.4 No IaC, no runbook, no DR notes — `MEDIUM`
Unverifiable from the repo: backups, restore tests, RTO/RPO, who gets paged.

**To get this module to 8+:** Dockerfile + CI + migrate-before-deploy + a one-page runbook (health URLs, how to revoke tokens, how to expire a stuck checkout).

---

### Module 15 — Documentation & Maintainability — **6/10**

**Verdict in one paragraph:** The architecture docs are unusually good for a repo this size. The server README is still the Nest.js marketing page. A new backend developer can learn the rules from ADRs and then has to guess how to run Postgres.

**What's working:** `docs/decisions/` (BFF, provider pattern, seller-owned products, JWT, file privacy, ownership). `server/walkthrough.md` and `server/AGENTS.md` exist. Code comments that were read explained *why* (dummy bcrypt hash, atomic checkout claim, audit must not block). Zero `TODO`/`FIXME`/`HACK` in `server/src`.

**Findings:**

#### 15.1 `server/README.md` is the Nest starter — `MEDIUM`
**Where:** `server/README.md:1-98`

It tells you how to donate to Nest and deploy on Mau. It does not say: copy `.env.example`, run Postgres, `npm run prisma:migrate:dev`, `npm run start:dev`, API is on :3001, Swagger at `/api` when enabled.

**Fix:** Replace it with a 15-minute local setup. Keep the walkthrough for architecture.

**Effort:** 1h

#### 15.2 Onboarding friction
A new backend developer can be productive in a week **if** someone points them at `AGENTS.md` + `walkthrough.md` + an existing module (`products` / `orders`). They will lose the first afternoon on env and “why is there no Docker.”

**To get this module to 8+:** Rewrite `server/README.md`. Link the ADRs from it.

---

## Quick Wins

- Require `Idempotency-Key` (or body `idempotencyKey`) on `POST /orders/checkout`.
- `genSalt(12)` in `bcrypt.provider.ts`.
- Joi: `JWT_SECRET.min(32)` and pin `algorithms: ['HS256']`.
- CORS: use the `FRONTEND_URL` allow-list in every environment.
- Delete `images?: any[]` from `CreateProductDto`.
- Read `PORT` from ConfigService, not `process.env`.
- Log a warning when checkout confirmation email fails (do not swallow silently).
- Only *create* the seed admin — never attach `SUPER_ADMIN` to an existing user.
- Add `.editorconfig`.
- Replace `server/README.md` with a real setup page.

---

## Couldn’t Verify — Needs a Human

| What | How to confirm |
|------|----------------|
| Live secret strength / reuse | Check the secret manager (or host env) for `JWT_SECRET` length and that staging ≠ prod. Rotate if it was ever committed historically (`git log -S JWT_SECRET --all`). |
| `npm audit` / lockfile drift | `cd server && npm audit --omit=dev` and `npm ci`. I could not run audit in this pass. |
| Actual Postgres indexes vs `schema.prisma` | `\d+ orders` / `\d+ product_variants` in `psql` on staging. Look for unused and missing. |
| Pool math | `SHOW max_connections;` vs `instances × Prisma/pg pool`. |
| Whether Nest is internet-facing | If only the Next BFF can reach :3001, CORS/Swagger risk drops. If Nest has a public DNS name, treat every finding as-is. |
| TLS / HSTS / HTTP→HTTPS | Edge/load-balancer config. Not in this repo. |
| Backups and restore | Ask whoever runs Postgres: last restore test date, encryption, retention. An untested backup is not a backup. |
| Alerts | Confirm something pages a human on 5xx rate, checkout p95, and sweeper failures. |
| Circular deps | `npx madge --circular server/src` from a clean install. |
| Staging `NODE_ENV` | Must be `production` (Joi allows only `development\|production\|test`). If it is `development`, CORS is wide open. |
| Stripe webhook endpoint in Stripe dashboard | Signing secret set; endpoint is `POST /orders/webhooks/stripe` (or the BFF proxy to it). |
| File storage in prod | Today this is local disk (`UPLOADS_ROOT`). Multiple pods will not share uploads unless you put them on object storage or a shared volume. |

---

## Suggested Roadmap

**Week 1 (before production):**
Require checkout idempotency. Raise JWT secret policy and pin HS256. bcrypt cost 12. CORS allow-list everywhere. Configure pg pool + statement timeout. Dockerfile (non-root). CI: lint, typecheck, test, audit. Magic-byte upload check. Confirm Nest is not publicly exposed (or put it behind the BFF only).

**Weeks 2–4:**
Session version on password change. Split JWT secrets. Integer-cent pricing. CHECK constraints. Fix `rating_desc` (denormalise rating). Redis throttle if >1 instance. Structured logs + Sentry. Ownership tests. Rewrite `server/README.md`. Unique PaymentIntent id. Admin-seed must not promote.

**Backlog:**
`timestamptz` migration. Trigram/search. Error codes. Pino. Queue for mail. E2E checkout. Constraint renames. Object storage for uploads if you scale out. MFA if the risk profile changes.

---

## Assumptions & Method

**Assumed:** The Nest process is deployable on its own (findings treat it as a production HTTP API). The Next BFF is the intended public door (ADR-001) but was not audited. `NODE_ENV=production` will be set in prod. Stripe stays in test mode until week-1 items land.

**Read:** `package.json`, `tsconfig.json`, `eslint.config.mjs`, `.env.example`, `.gitignore`, `main.ts`, `app.module.ts`, env/JWT/app/stripe/database config, Prisma schema, auth lifecycle (controller, guards, login/refresh/logout/reset/forgot, token store, bcrypt), roles guard, filters, pagination, checkout create/complete/webhook/expire/lock/stock, payments ownership + refund + lifecycle, files controller + secure download + multer, products list/query/create DTO, users profile/block/map, reviews/notifications/cart/address/dashboard/seller/store controllers, health, swagger, seed admin, audit, job lock, 19 spec filenames, ADRs index, `server/README.md`.

**Commands:** `git rev-parse`, file/LOC counts via Node, ripgrep across `server/src` for `any`, `process.env`, `@Auth(NONE)`, raw SQL, secrets patterns, injection phrases, `console.log`, TODO, eslint-disable. `npm audit` and `madge` were not run.

**Coverage:** ~418 TS files in `server/src`; this review read the control plane (auth, checkout, payments, files, schema, config, filters) in full and sampled the rest via controllers + ownership providers. It is not a line-by-line read of every DTO. Findings that needed a surrounding read were opened before they were written down.

**Limits:** No running app, no database, no Stripe account, no staging cluster. Performance findings are inferred from query shapes, not from query logs.
