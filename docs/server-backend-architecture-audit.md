# Server backend architecture & database audit

**Scope:** `server/` (NestJS 11 + Prisma 7 + PostgreSQL)  
**Date:** 9 September 2026  
**Method:** Traced **actual source**, schema, and SQL migrations. Walkthroughs and `AGENTS.md` were used only as maps. Where docs and code disagree, **code wins**.

**Docs vs code (found during this audit):**

- `server/AGENTS.md` still says there are no `src/**/*.spec.ts` files. There are dozens of unit specs (checkout, stock locks, job locks, auth, payments). There is still **no e2e harness** (`npm run test:e2e` points at a missing `test/jest-e2e.json`).
- `prisma/schema.prisma` is incomplete versus deployed SQL: CHECK constraints, `pg_trgm` GIN indexes, and a partial unique index on checkout PaymentIntents live **only** in migrations.

**Implementation status legend:**

| Symbol | Meaning |
| ------ | ------- |
| ✅ | Implemented correctly |
| 🟡 | Implemented but can be improved |
| 🔴 | Incorrect / risky implementation |
| ❌ | Missing but recommended |
| ⚪ | Not applicable |

---

## 1. Concept inventory

### Database

| Concept | Where Used | What It Does | Why Necessary | Status | Production Readiness | Recommended Improvement |
| ------- | ---------- | ------------ | ------------- | ------ | -------------------- | ----------------------- |
| Interactive transactions (`$transaction` callback) | Checkout create/complete/cancel/expire; refresh rotation; reviews; addresses; refunds; seller approve | Groups multi-row writes so they commit or roll back together | Checkout, stock, payments, and tokens cannot be left half-written | 🟡 | Strong on reservation/complete; Stripe I/O correctly **outside** TX. Weak where a second checkout expires an in-flight session | Keep Stripe outside TX. Do **not** expire sessions whose PI attach is in flight |
| Nested / sequential transactions | `CreateCheckoutProvider.createOnce`: TX1 reserve+orders, then Stripe, then TX2 attach PI | Avoids holding `FOR UPDATE` across Stripe HTTP | Row locks must not span network I/O | 🟡 | Correct pattern, unsafe window if `clearForUser` runs in that gap | Attach PI only if session still `PENDING`; serialize one pending checkout per user inside TX1 |
| Isolation levels | Nowhere — Postgres default **READ COMMITTED** | Not set | REPEATABLE READ is rarely needed if row locks are used | ⚪ | Fine given `FOR UPDATE` | Leave default; do not add SERIALIZABLE unless you measure |
| Pessimistic locking (`SELECT … FOR UPDATE`) | `lock-product-variants.util.ts`; reviews (product row); `PaymentLifecycleProvider.applyRefund` | Serializes stock/refund/rating updates | Prevents oversell and double-refund math | ✅ | Production-ready for those rows | Never call `adjustVariantStock` outside a TX (callers currently pass `tx`) |
| Deadlock avoidance | `sortedVariantIds` before `FOR UPDATE` | Locks variants in stable ID order | Two checkouts of SKUs A+B vs B+A would deadlock | ✅ | Production-ready | Keep this whenever you lock multiple rows |
| Atomic increment/decrement | `adjustVariantStock` + SQL `CHK_product_variants_stock_quantity_non_negative` | Reserve = decrement; release = increment; CHECK stops negative stock | Inventory must not go negative even if a path skips the app check | ✅ | Solid for checkout | Seller **absolute** `stockQuantity` overwrite still fights this model |
| Optimistic concurrency (row version) | **No** `version` on orders/payments. `User.tokenVersion` is JWT invalidation only | — | OCC is optional if you use `updateMany` claims | ⚪ | Token version is the right tool for JWT revoke | Do not add OCC on stock; keep locks |
| Compare-and-swap claims (`updateMany` + count) | Complete checkout (`PENDING→COMPLETED`); cancel/expire session; cancel order; COD reject; refresh `revokedAt: null` | Only one winner for a state transition | Client + webhook must not both complete | ✅ | Production-ready as a mutex | Reuse this pattern for order status (`SHIPPED`) |
| Unique constraints | Email, slug, SKU, cart `(userId, variantId)`, checkout `(userId, key)`, review `(userId, productId)`, etc. | DB-level uniqueness | App checks race; unique indexes do not | ✅ | Production-ready | Soft-deleted emails/slugs still block reuse |
| Partial unique index | SQL only: `UQ_checkout_sessions_stripe_pi_not_pending` | Many sessions may use `'pending'`; real Stripe PI ids unique for pending/completed | Placeholder PI values cannot be globally unique | ✅ | Prisma schema does **not** declare it | Keep this as raw SQL; document so `migrate dev` does not drop it |
| Foreign keys + referential integrity | Entire `schema.prisma` | Cascade tokens/cart; Restrict products/orders so sold SKUs cannot vanish | History and inventory integrity | ✅ | Production-ready | `AuditLog.actorId` has **no** FK (intentional survival after user delete) |
| Cascading deletes | User → cart/tokens; Product → variants; Order → items/payment | Cleanup vs protect | Soft-deleted products still Restrict-protect orders via variants | ✅ | Production-ready | Do not Cascade User → Order (already Restrict) |
| CHECK constraints | Migrations `domain_check_constraints` + stock CHECK | Rating 1–5; amounts ≥ 0; quantity > 0 | Last line of defense vs bad writes | 🟡 | CHECKs not in `schema.prisma` | Add CHECKs for `refundedAmount`, `priceAtPurchase`, cart qty |
| Composite indexes | Orders `(userId, createdAt)`, `(storeId, createdAt)`; checkout `(status, createdAt)`; notifications `(userId, readAt)` | Match list queries | Offset lists without indexes become seq scans | 🟡 | Good for orders/checkout | Add `payments.createdAt`; catalog `(deletedAt, status, createdAt)`; `checkout_session_items.variantId` |
| GIN + `pg_trgm` | Migration `pg_trgm_product_search` | Speeds `ILIKE` product search | Btree on `name` does not help `%foo%` | ✅ | Not in Prisma schema | Add trgm for store name search if admin search grows |
| Soft delete | `User`, `SellerProfile`, `Store`, `Category`, `Product` only | Hide without destroying catalog/history | Variants/orders are **not** soft-deleted | ✅ | Unique indexes include tombstones | Rename tombstone slugs/emails if reuse is required |
| Denormalization | `Product.averageRating` / `reviewCount`; order-item snapshots; checkout shipping JSON | Fast catalog sort; immutable purchase history | Live product price must not rewrite past orders | ✅ | Review stats use `FOR UPDATE` | Keep snapshots; do not live-join catalog into historical orders |
| Normalization | Classic 3NF catalog + join tables (`UserRole`, file associations) | Avoid duplicated seller/store ownership | Multi-vendor requires 1:1 seller↔store | ✅ | Production-ready | — |
| Upsert | **No** Prisma `upsert()`. Wishlist `createMany({ skipDuplicates })`; job lock `ON CONFLICT`; checkout key `create` + P2002 | Same idea, different APIs | Cart add is check-then-create | 🟡 | Cart first-add can 409 under parallel clicks | `ON CONFLICT` / catch P2002 then update qty |
| Idempotency table | `CheckoutIdempotencyKey` + `CheckoutIdempotencyProvider` | Unique `(userId, key)`; store response JSON; wait/poll | Double-submit / retry must not create two PIs | 🟡 | Good mutex; hash is **shipping only**, 2‑min steal, no sweeper | Hash cart+totals; persist complete in same success path; TTL cleanup job |
| Stripe PI idempotency | `createPaymentIntent(..., { idempotencyKey: checkout:${userId}:${key} })` | Stripe dedupes PI create | Network retry must not create two charges | ✅ | Production-ready | Keep keyed to user+checkout key |
| Connection pooling | `PrismaService` → `new PrismaPg({ connectionString })` | `pg` default pool (typically max 10) | Prisma 7 driver adapter requires `pg` | 🟡 | Fine for one Nest replica + low concurrency | Set `max`, `idleTimeoutMillis`, statement_timeout; size vs RDS/PgBouncer |
| Migrations | `prisma/migrations/*` + `prisma:migrate:deploy` | Baseline + incremental SQL | Production schema must be versioned | ✅ | Strong | Treat SQL as source of truth for CHECK/GIN/partial unique |
| N+1 prevention | `PRODUCT_INCLUDE` / `PRODUCT_LIST_INCLUDE`; `findCartItemsWithImages`; `findOrdersWithImages` | Nested `include` in one query | Lists would explode without it | ✅ | Production-ready on hot paths | Watch dashboard aggregations as data grows |
| Offset pagination | `PaginationProviders.paginateQuery` | `skip/take` + `count(*)` | Simple page numbers for admin/seller UIs | 🟡 | Fine at current scale | Cursor for catalog/orders when pages go deep |
| Cursor pagination | **Not implemented** (dashboard “cursor” is a date loop variable) | — | Deep offset is slow/unstable | ❌ | Offset is OK now | Add cursor for public product feed if you paginate far |
| Query optimization | Shared Prisma query utils; select lists in locks | Avoid over-fetching on lock paths | Checkout must be short | 🟡 | Good | Catalog composites; avoid unbounded `findMany` on expire sweep as volume grows |
| Data validation (DB + DTO) | class-validator DTOs + PG enums + CHECKs | Invalid payloads never hit money math | Defense in depth | ✅ | Production-ready | Keep whitelist + `forbidNonWhitelisted` |
| Audit/history table | `AuditLog` + `AuditProvider.record` | Append-only JSON before/after + requestId/IP | Admin actions must be reconstructable | 🟡 | Fire-and-forget; can lose write on crash | Best-effort is OK; add query API; cover login/product mutations if needed |
| Prisma 7 adapter | `prisma.service.ts`, `schema.prisma` datasource without URL | CLI URL in `prisma.config.ts` | Prisma 7 requirement | ✅ | Production-ready | Do not edit `src/generated/prisma` |
| PostgreSQL enums | Many `*_enum` types | Constrains status/role at DB | Stops invalid status strings | ✅ | Production-ready | — |
| JSONB | Idempotency `responseJson`; audit `before`/`after` | Flexible payloads | Replay checkout response without extra tables | ✅ | Production-ready | Redact secrets in `after` (code comments already warn) |

### Backend

| Concept | Where Used | What It Does | Why Necessary | Status | Production Readiness | Recommended Improvement |
| ------- | ---------- | ------------ | ------------- | ------ | -------------------- | ----------------------- |
| Controller → Service → Provider | All `src/modules/*` | HTTP vs facade vs one use-case class | Matches ADR 002; keeps controllers thin | ✅ | Production-ready | Keep this; do not add a repository layer |
| Ownership providers | `product-ownership`, `order-ownership`, `address-ownership`, files, payments, reviews | Seller/store/user gates in one place | Multi-vendor authz must not be copy-pasted | ✅ | Production-ready | Product create **ignores** client `storeId` (correct) |
| Dependency injection | Nest modules; abstract `HashingProvider` | Swappable bcrypt | Testability | ✅ | Production-ready | — |
| Global ValidationPipe | `main.ts` | whitelist, transform, forbid extra fields | Mass-assignment protection | ✅ | Production-ready | `enableImplicitConversion` is slightly aggressive on query DTOs |
| Custom pipes | `RequireUploadedFilePipe` | Fail if multer file missing | Multipart endpoints | ✅ | Production-ready | — |
| Custom interceptors | File upload interceptors; **global** `DataResponseInterceptor` | Envelope `{ data, version }` | BFF contract | 🔴 | JSON APIs OK; wraps **health, webhook, `StreamableFile`** | Skip interceptor for streams, health, Stripe webhook |
| Exception filters | `HttpExceptionFilter`, `PrismaExceptionFilter`, `AllExceptionsFilter` | Stable `{ statusCode, message, error, requestId }` | Clients need a single error shape | 🟡 | Nest order (Http → Prisma → All) is correct | Log 5xx HttpExceptions; log unmapped Prisma codes |
| Middleware | `requestIdMiddleware` in `main.ts` | Correlation ID + ALS | Trace a checkout across logs/audit | 🟡 | Works | Prefer `req.ip` with `trust proxy`; do not blindly trust `x-forwarded-for[0]` |
| Request context (ALS) | `request-context.ts`; patched in `AccessTokenGuard`; read by `AuditProvider` | Request-scoped user/ip/id without passing args | Audit without polluting every signature | 🟡 | Correct idea | No-op if ALS missing; bind structured logger to the store |
| Response envelope | `DataResponseInterceptor` + `API_VERSION` | `{ data, version }` — **not** URL versioning | BFF unwraps `data` | 🟡 | Envelope version ≠ API version | Skip binary/health; keep BFF as the public `/api/v1` |
| Swagger | `setup-swagger.ts` at `/api`; **off in production** | Document DTOs/Bearer | Dev DX | 🟡 | Prod-off is correct | `SWAGGER_ENABLED` Joi boolean vs string check is messy; hardcoded server URL |
| Modular architecture | `app.module.ts` domain + `integrations/` | Mail/Stripe/storage stay adapters | Domain owns money rules | ✅ | Production-ready | — |
| Integer-cent money | `money.util.ts` + checkout pricing | Avoid IEEE-754 dollars | Stripe amounts are cents | ✅ | Production-ready | Keep Decimal → cents; never accumulate floats |
| Health checks | `GET /health/live`, `/health/ready` (`SELECT 1`) | K8s probes | Ready ≠ live | 🟡 | Ready is useful | Envelope wrapping; no Stripe/SMTP/disk |
| Graceful shutdown | `enableShutdownHooks` + Prisma `$disconnect` | Drain Nest + close pool | Deployments | 🟡 | Better than nothing | Forced-exit timer; stop accepting traffic before releasing job lock |
| Config / Joi | `environment.validation.ts` + namespaced configs | Fail-fast on missing/weak JWT, prod Stripe webhook, FRONTEND_URL | Misconfig must not boot | ✅ | Production-ready | Distinct JWT secrets; weak-secret denylist. Add MAIL_FROM |
| Seed gating | `ALLOW_ADMIN_SEED`, disabled when `NODE_ENV=production` | Prevent accidental prod seed | Safety | ✅ | Production-ready | Keep SeedersModule imported; gate in provider |

### Authentication & authorization

| Concept | Where Used | What It Does | Why Necessary | Status | Production Readiness | Recommended Improvement |
| ------- | ---------- | ------------ | ------------- | ------ | -------------------- | ----------------------- |
| JWT access + refresh | `auth` module; `@nestjs/jwt` | Short access (15m), hashed refresh (7d) | Stateless access + revocable refresh | ✅ | Production-ready | — |
| Algorithm pinning | `jwt-algorithm.constants.ts` HS256 only | Block alg confusion | `algorithms: ['HS256']` on verify | ✅ | Production-ready | — |
| Refresh rotation + reuse detection | `RefreshTokenStoreProvider.rotate` | Consume old hash; insert new; reused revoked token wipes `familyId` | Stolen refresh replay | ✅ | Solid; multi-tab looks like theft | Optional short grace window |
| Token hashing | SHA-256 of refresh in DB (`tokenHash` unique) | DB leak ≠ usable refresh | Never store raw refresh | ✅ | Production-ready | — |
| `tokenVersion` | Increment on password change/block; guard compares JWT claim | Kill all access tokens without a denylist | Password change must invalidate sessions | ✅ | Production-ready | Prefer one TX with refresh revoke |
| AccessTokenGuard DB load | Every authenticated request | Reject deleted/blocked; fresh roles | JWT roles can go stale | ✅ | Correct and slightly expensive | Cache user row briefly if needed later |
| Password hashing | `BcryptProvider` cost **12** | Slow hash | Login brute-force | ✅ | Production-ready | Pepper optional; Argon2 later |
| Anti-enumeration register | `RegisterProvider` maps P2002 to same 201 shape | Do not leak “email exists” | Account harvesting | ✅ | Production-ready | — |
| Default-deny Bearer | `AuthenticationGuard` default `AuthType.BEARER` | Public only if `@Auth(NONE)` | Safer default | ✅ | Production-ready | — |
| RBAC | `RolesGuard` + `@Roles`; `UserRole` join (multi-role) | BUYER / SELLER / SUPER_ADMIN | Multi-vendor | ✅ | OR-semantics; no fine-grained permissions | Enough for this product; do not invent a permission matrix yet |
| Seller-owned catalog | `ProductOwnershipProvider`; no admin product mutations | Catalog writes bind to the seller’s store | ADR 003 | ✅ | Production-ready | — |
| Own-store purchase block | `assert-not-own-store-purchase.util.ts` | Seller cannot buy from self at checkout | Inventory/payment fraud | ✅ | Production-ready | — |
| File privacy | `main.ts` 404 on `/uploads/sellers` + `customer-documents`; `SecureFileAccessProvider` | Private docs only via auth download | KYC docs must not be public | 🟡 | Prefix 404 + owner check is good | Interceptor may wrap `StreamableFile`; `Cache-Control: private, no-store` is set |

### Security

| Concept | Where Used | What It Does | Why Necessary | Status | Production Readiness | Recommended Improvement |
| ------- | ---------- | ------------ | ------------- | ------ | -------------------- | ----------------------- |
| Helmet | `app.use(helmet())` defaults | Baseline headers | XSS/clickjacking basics | 🟡 | CORP `same-origin` can break Next loading Nest `/uploads` | Tune CORP/COEP for public images |
| CORS | `FRONTEND_URL` allowlist, `credentials: true` | Restrict browser origins | Direct Nest hits (Swagger) | 🟡 | BFF is same-origin to Next; CORS is secondary | Fine |
| CSRF | **None on Nest** | — | API is Bearer; cookies live on Next | ⚪ | Correct **if** Nest never sets session cookies | Keep CSRF on the BFF/cookie layer |
| Rate limiting | Global 100/min; auth 5–20/min; skip health + Stripe webhook | Slow brute-force | Login/forgot must be tight | 🟡 | In-memory; not shared across replicas | Redis store; consider throttle **before** auth |
| Input sanitization | DTO whitelist; file magic bytes (`file-signature.ts`); path traversal guards in local storage | MIME spoofing / `../` | Uploads are a classic RCE/leak vector | ✅ | Magic-byte vs claimed MIME is strong | Virus scan later; still local disk |
| Secrets | Joi min 32 + distinct JWT secrets; webhook secret required in prod | Weak secrets must not boot | HS256 is only as strong as the secret | ✅ | Production-ready | Rotate runbooks |
| Trust proxy | `trust proxy = 1` | Real client IP for throttle | Behind LB | 🟡 | Needed | Align IP parsing with Express `req.ip` |
| File upload limits | Multer 5MB images / 10MB docs | DoS via huge files | — | ✅ | Production-ready | — |

### Background jobs

| Concept | Where Used | What It Does | Why Necessary | Status | Production Readiness | Recommended Improvement |
| ------- | ---------- | ------------ | ------------- | ------ | -------------------- | ----------------------- |
| In-process interval | `ExpireAbandonedCheckoutsProvider` 5 min `setInterval` | Release stock / cancel stale PIs | Abandoned checkout holds inventory | 🟡 | Works on one or more replicas **with** DB lock | Prefer a real scheduler/queue when you add more jobs |
| Distributed job lock | `JobLockProvider` `INSERT … ON CONFLICT … WHERE lockedUntil < NOW()` | Single-flight across instances | Two replicas must not double-expire | 🟡 | TTL crash-safe; **not** a fencing token | Heartbeat if sweep can exceed 4 min; release only if still owner |
| Job retries / DLQ / BullMQ | **Not present** | Mail and jobs are sync/`setInterval` | Stripe SDK has `maxNetworkRetries: 1` | ❌ | Stripe webhook 503 retry is the real retry bus | Outbox for emails/refunds before Redis queues |
| Exponential backoff | **Not present** (except Stripe client) | — | — | ❌ | Webhook 503 lets Stripe backoff | Add when mail/refunds are queued |

### Reliability

| Concept | Where Used | What It Does | Why Necessary | Status | Production Readiness | Recommended Improvement |
| ------- | ---------- | ------------ | ------------- | ------ | -------------------- | ----------------------- |
| Webhook signature + ack policy | `StripeWebhookProvider` + `isPermanentCompletionFailure` | Verify `rawBody`; 200 vs 503 | Stripe retries forever on 5xx | 🟡 | Signature is correct. **NotFound after expire is treated as permanent** → charge without fulfill | Do not ACK `succeeded` if PI is paid and session is gone; reconcile/refund |
| Stripe event inbox | **No** `event.id` table | Dedup relies on session claim | Duplicate `succeeded` is OK; other events would not be | 🟡 | Enough for PI succeeded/failed | Persist event ids if you add more event types |
| Outbox | **Missing** | Cancel-order: Stripe refund then DB; mail after commit | Crash between Stripe and DB | 🔴 | Claim-first is good; flipping order back to `PENDING` after a successful refund is dangerous | Refund-pending state or outbox |
| Mail reliability | `MailService` awaited on some paths | SMTP fail can fail the HTTP request | Checkout complete still tries not to block money TX | 🟡 | Fire-and-forget after checkout commit (good) | Queue mail; placeholder `noreply@example.com` |

### Performance

| Concept | Where Used | What It Does | Why Necessary | Status | Production Readiness | Recommended Improvement |
| ------- | ---------- | ------------ | ------------- | ------ | -------------------- | ----------------------- |
| Compression | `compression()` in `main.ts` | gzip JSON | Bandwidth | ✅ | Fine | — |
| Caching / Redis | **None** | — | Catalog is read-heavy | ❌ | Not needed for a first production cut if DB is indexed | Cache public product lists later |
| Per-request user fetch | `AccessTokenGuard` | Fresh block/delete/version | Security over speed | ✅ | Acceptable | Short TTL cache keyed by userId+tokenVersion |

### Observability

| Concept | Where Used | What It Does | Why Necessary | Status | Production Readiness | Recommended Improvement |
| ------- | ---------- | ------------ | ------------- | ------ | -------------------- | ----------------------- |
| Request / correlation ID | Middleware + error envelope + audit `requestId` | Tie logs to a checkout | Support + incident response | 🟡 | Header echoed | JSON logs with `requestId` on every line; don’t trust client IDs blindly |
| Structured logging | Nest `Logger` strings only | Some warn/error on webhook/sweep | — | ❌ | Weak for production ops | pino/winston JSON + level from env |
| Metrics / tracing | **None** | — | SLO, Stripe latency, TX time | ❌ | Health only | OpenTelemetry + Stripe/checkout histograms |
| Audit logging | Admin/seller/order/payment actions | Who did what | Compliance | 🟡 | No list API; not on login/catalog | Query endpoint for SUPER_ADMIN |

### API design

| Concept | Where Used | What It Does | Why Necessary | Status | Production Readiness | Recommended Improvement |
| ------- | ---------- | ------------ | ------------- | ------ | -------------------- | ----------------------- |
| No Nest global prefix | Controllers at `/auth`, `/products` | BFF remaps `/api/v1/{role}` | ADR 001 | ✅ | Production-ready | Do not enable Nest URI versioning unless you dual-run APIs |
| DTO + Swagger decorators | Module `dto/` | Contract + docs | Validation + OpenAPI | ✅ | Production-ready | — |
| Idempotent checkout API | Required `Idempotency-Key` / DTO key | Safe POST retry | Payments | 🟡 | See hash/TTL caveats | Include cart in hash |
| Public vs authenticated routes | `@Auth(NONE)` on catalog, health, webhook | Marketplace browse | — | ✅ | Production-ready | Webhook is NONE + signature (correct) |

### Architecture

| Concept | Where Used | What It Does | Why Necessary | Status | Production Readiness | Recommended Improvement |
| ------- | ---------- | ------------ | ------------- | ------ | -------------------- | ----------------------- |
| Integration adapters | `integrations/stripe\|mail\|storage` | Thin SDK wrappers | Domain must own refund/complete rules | ✅ | Admin `RecordRefundProvider` is **DB-only** (intentional) | Do not “fix” that by calling Stripe unless product changes |
| Testing | ~39 unit spec files; Jest; **no e2e** | Money-path unit tests exist | Checkout/lock/idempotency/job-lock covered | 🟡 | Better than the docs say | Add e2e for webhook+checkout; `test:e2e` script is broken |
| Local object storage | `LocalStorageProvider` | Disk files + UUID names | Simple deploy | 🟡 | Not multi-instance safe | S3/R2 when you scale horizontally |

---

## 2. Detailed concept explanations

### Transactions

**Concept:** Interactive transactions  
**Where:** `CreateCheckoutProvider`, `CompleteCheckoutProvider`, `ExpireAbandonedCheckoutsProvider`, `RefreshTokenStoreProvider.rotate`, review/address/refund providers.  
**Problem:** Several rows must change together (variants, session, orders, payments).  
**How it works:** Prisma `$transaction(async (tx) => { … })` uses one Postgres connection. Default isolation is READ COMMITTED. No custom `timeout` / `isolationLevel`.  
**Why we need it:** A reserved unit with no order, or a completed session with PENDING payments, is a money bug.  
**Example from this project:** Checkout TX1 locks variants, decrements stock, inserts session + per-store orders + payments. Stripe runs **after** that commit.  
**Production considerations:** Do not put Stripe inside the lock TX. The remaining risk is **other code** (`clearForUser`) mutating that session before TX2 attaches the PI.

### Idempotency

**Concept:** Idempotency  
**Where:** `CheckoutIdempotencyProvider` + unique `(userId, key)`; Stripe PI idempotency key; complete-checkout session claim.  
**Problem:** Double-click, client retry, and Stripe webhook retry.  
**How it works:** First request `create`s the key. Concurrent same key hits P2002 and polls up to 4s for `responseJson`. Different body hash → 409.  
**Why we need it:** Two PaymentIntents for one cart is a charge/support disaster.  
**Example from this project:** `CreateCheckoutProvider.create()` requires an idempotency key (header or DTO).  
**Production considerations:** Hash is **shipping address only**, so the same key + same address + different cart can replay the old PI. In-flight steal after 2 minutes can start a second checkout. `complete()` failure is swallowed so a successful checkout is not aborted — good — but then a later steal can duplicate.

### Concurrency

**Concept:** Concurrency / race-condition prevention  
**Where:** `FOR UPDATE` on variants; `updateMany` status claims; unique constraints; job lock.  
**Problem:** Two checkouts, client+webhook, two refunds, two refreshes.  
**How it works:** Locks serialize stock. Claims make state transitions single-winner. Uniques reject duplicate inserts.  
**Why we need it:** Oversell and double-complete are the two fatal e-commerce bugs.  
**Example from this project:** Complete path: `updateMany({ status: PENDING })`; if `count === 0`, reload succeeded payments (webhook vs client).  
**Production considerations:** Seller `stockQuantity = dto.stockQuantity` is an absolute write **without** locking reserved units — that can oversell or create phantom stock when expire increments later.

### Database locking

**Concept:** Database locking  
**Where:** `lock-product-variants.util.ts` (`FOR UPDATE`, sorted IDs); payments refund; product row for review stats.  
**Problem:** READ COMMITTED allows two transactions to both read stock=1.  
**How it works:** First TX holds the row; the second waits; then re-reads stock. CHECK `stockQuantity >= 0` is backup.  
**Why we need it:** App-level “if stock >= qty” without a lock is not safe.  
**Example from this project:** `adjustVariantStock` re-locks, aggregates qty per variant, then `decrement`.  
**Production considerations:** No `SKIP LOCKED` (correct for checkout; you must wait). Expire sweep does not need SKIP LOCKED because the job lock already single-flights the sweeper.

### Connection pooling

**Concept:** Connection pooling  
**Where:** `PrismaService` + `@prisma/adapter-pg`.  
**Problem:** Postgres connections are scarce; Nest concurrency needs a pool.  
**How it works:** `PrismaPg({ connectionString })` — **no** `max` / `idleTimeout`. Default `pg` pool (~10). `$connect` on init, `$disconnect` on destroy. Ready probe uses the same pool.  
**Why we need it:** Prisma 7 does not use the old connection-string `connection_limit` the same way.  
**Example from this project:** Checkout TX + Stripe + sweep share this pool.  
**Production considerations:** Two Nest replicas × 10 plus migrations/admin can exhaust small RDS. Set pool size explicitly.

### Indexing

**Concept:** Indexing  
**Where:** `schema.prisma` `@@index` / `@@unique` plus SQL GIN/partial unique.  
**Problem:** List endpoints filter `userId` / `storeId` / `status` and sort `createdAt`.  
**How it works:** Order composites match `GetOrdersProvider`. Checkout `(status, createdAt)` matches the abandon sweep. Product ILIKE uses `pg_trgm` GIN (SQL only).  
**Why we need it:** Offset pagination with `count(*)` is painful without indexes.  
**Example from this project:** `@@index([userId, createdAt])` on `Order`.  
**Production considerations:** Schema file is **incomplete** vs SQL. Next `migrate dev` can try to drop GIN/CHECKs. Missing: `payments.createdAt`, catalog composites, `checkout_session_items.variantId`.

### Audit logs

**Concept:** Audit logs  
**Where:** `AuditProvider` → `audit_logs`.  
**Problem:** Who blocked a user, approved a seller, recorded a refund.  
**How it works:** Fire-and-forget `create`; failures logged, never thrown. Actor from ALS (`userId`, role, `requestId`, IP).  
**Why we need it:** Admin/money actions need a trail that is not the HTTP access log.  
**Example from this project:** Used on block/unblock, seller approve/reject/suspend, order cancel/status, COD, refunds.  
**Production considerations:** Lost if process dies before the insert. No query API. Login, product edits, and file downloads are not audited.

### Request context and correlation IDs

**Concept:** Request context and correlation IDs  
**Where:** `request-id.middleware.ts`, `request-context.ts`, error filters, audit.  
**Problem:** Support needs to join “this 500” to “this checkout”.  
**How it works:** `x-request-id` or `randomUUID()`, stored on `req`, echoed, ALS `run`. Guard patches `userId` / `roles`.  
**Why we need it:** Async jobs and filters cannot rely on passing `req` everywhere.  
**Example from this project:** `AllExceptionsFilter` logs `[requestId]`.  
**Production considerations:** Clients can spoof `x-request-id`. First `x-forwarded-for` hop can be spoofed if the proxy appends.

### Response interceptors

**Concept:** Response interceptor  
**Where:** Global `DataResponseInterceptor`.  
**Problem:** Uniform success bodies for the BFF.  
**How it works:** Every controller return becomes `{ data, version }` from `app.apiVersion` (default `v1`).  
**Why we need it:** ADR on envelope; BFF unwraps `data`.  
**Example from this project:** Health becomes `{ data: { status: 'ok' }, version: 'v1' }`.  
**Production considerations:** Wrapping `StreamableFile` from `GET /files/secure/:fileId` is a real download bug. Skip binary, health, and webhook.

### Exception filters

**Concept:** Exception filters  
**Where:** `common.module.ts` APP_FILTER order All → Prisma → Http (Nest runs **last registered first**).  
**Problem:** Prisma P2002 must be 409, not a stack dump.  
**How it works:** HttpException → mapped body. Prisma known errors → 409/404/400/500. Unknown → AllExceptionsFilter 500 + log.  
**Why we need it:** Never leak SQL to the client.  
**Example from this project:** Unmapped Prisma codes still return generic `"Database error"` **without logging**.  
**Production considerations:** Log those 500s. 5xx `HttpException`s also skip `AllExceptionsFilter` logging.

### Pipes

**Concept:** Pipes  
**Where:** Global `ValidationPipe`; `ParseIntPipe`; upload file pipe.  
**Problem:** Extra JSON fields and wrong types.  
**How it works:** whitelist strips unknown keys; `forbidNonWhitelisted` 400s them; transform + class-validator.  
**Why we need it:** Mass assignment on `isBlocked` / `role` must be impossible.  
**Example from this project:** DTOs in each module.  
**Production considerations:** Good. Implicit conversion can coerce query params surprisingly.

### Guards

**Concept:** Guards  
**Where:** `AuthenticationGuard` (auth module), `AccessTokenGuard`, `RolesGuard` (common), `ThrottlerGuard` (app).  
**Problem:** Default-public is how marketplaces leak admin APIs.  
**How it works:** No `@Auth` → Bearer. JWT `typ` must be ACCESS. User loaded; deleted → 401; blocked → 403; `tokenVersion` mismatch → 401. `@Roles` is OR.  
**Why we need it:** Multi-role users (buyer who became seller).  
**Example from this project:** Stripe webhook is `@Auth(NONE)` + signature in the provider, not a JWT.  
**Production considerations:** Per-request DB user load is the right security tradeoff.

### Middleware

**Concept:** Middleware vs Nest middleware  
**Where:** Express `app.use(requestIdMiddleware)` before helmet.  
**Problem:** Correlation must exist even if guards throw.  
**How it works:** Runs first; ALS wraps `next()`.  
**Why we need it:** Filters/audit after a failed JWT still need an ID.  
**Example from this project:** `main.ts` order: request-id → helmet → compression.  
**Production considerations:** Fine. Not route-scoped.

### Job locks / distributed locks

**Concept:** Job locks / distributed locks  
**Where:** `JobLockProvider` + expire-abandoned job.  
**Problem:** Two Nest processes both sweeping would double-release stock.  
**How it works:** Upsert lock row; `WHERE lockedUntil < NOW()` so only an expired lock is stolen. `runExclusive` releases to epoch in `finally`. TTL 4 min, interval 5 min.  
**Why we need it:** Horizontal scale without Redis.  
**Example from this project:** Lock name `expire-abandoned-checkouts`.  
**Production considerations:** If work exceeds TTL, a second worker can run in parallel. Session `updateMany` still prevents double expire of one session. Release does not check owner — good enough for this one job, not a generic distributed lock library.

### Background jobs

**Concept:** Background jobs  
**Where:** Only this `setInterval` sweeper. No BullMQ, no `@nestjs/schedule`.  
**Problem:** PENDING checkouts hold stock for 30 minutes (`CHECKOUT_ABANDON_TTL_MS`).  
**How it works:** If PI is real, retrieve Stripe; skip if succeeded/processing; cancel PI; then TX claim EXPIRED + release stock. If PI is still `'pending'`, Stripe is skipped.  
**Why we need it:** Otherwise inventory leaks forever.  
**Example from this project:** `ExpireAbandonedCheckoutsProvider.expireSession`.  
**Production considerations:** `clearForUser` expires **all** pending sessions immediately, including PI=`'pending'` — that is the dangerous interaction with create-checkout TX1/TX2.

### Retries

**Concept:** Retries  
**Where:** Stripe SDK `maxNetworkRetries: 1`; webhook returns 503 for transient complete failures; Stripe retries the webhook. Checkout idempotency for client retries.  
**Problem:** Networks fail.  
**How it works:** Permanent 4xx (mismatch, not found, forbidden) ACK 200 so Stripe stops. Transient → 503.  
**Why we need it:** Infinite webhook retries vs silent money loss.  
**Example from this project:** `isPermanentCompletionFailure` treats `NotFoundException` as permanent.  
**Production considerations:** After `clearForUser`/expire, a paid PI can complete with NotFound → **200 ACK, charge kept, stock released**. That is the highest-severity reliability bug.

### Rate limiting

**Concept:** Rate limiting  
**Where:** `ThrottlerModule` 100/60s; auth controller tighter; `@SkipThrottle` health + webhook.  
**Problem:** Credential stuffing and email bombs (forgot password).  
**How it works:** In-memory counters keyed by IP (`trust proxy`).  
**Why we need it:** `forgot` at 5/min is the important one.  
**Example from this project:** Auth controller per-route limits (register/forgot/reset 5; login 10; refresh/logout 20).  
**Production considerations:** Two instances = 2× limit. Restarts reset counters. Unauthenticated hammering of Bearer routes may not count if Throttler runs after Auth.

### Caching

**Concept:** Caching  
**Where:** Only `Cache-Control: private, no-store` on secure files. No Redis / `CacheModule`.  
**Problem:** Catalog reads.  
**How it works:** Every list hits Postgres.  
**Why we need it (later):** Public product pages.  
**Example from this project:** N/A.  
**Production considerations:** Index first; cache when `EXPLAIN` says so.

### Health checks

**Concept:** Health checks  
**Where:** `HealthController` / `HealthService`.  
**Problem:** Orchestrator must not send traffic to a process that cannot reach Postgres.  
**How it works:** Live = process up. Ready = `SELECT 1`. Both public and unthrottled.  
**Why we need it:** Rolling deploys.  
**Example from this project:** Ready 503 `"Database unavailable"`.  
**Production considerations:** Probe JSON may include the envelope. Point probes at HTTP status, or skip the interceptor.

### Graceful shutdown

**Concept:** Graceful shutdown  
**Where:** `app.enableShutdownHooks()`; Prisma `onModuleDestroy`; expire provider `clearInterval`.  
**Problem:** SIGTERM mid-transaction or mid-sweep.  
**How it works:** Nest stops HTTP; Prisma disconnects; timer cleared. Job lock released in `finally` if the sweep is in `runExclusive`.  
**Why we need it:** Kubernetes SIGTERM.  
**Example from this project:** `ExpireAbandonedCheckoutsProvider.onModuleDestroy`.  
**Production considerations:** No drain timeout. In-flight Stripe+TX2 can still race shutdown.

### Observability

**Concept:** Observability  
**Where:** Nest Logger, request IDs, health. No metrics/tracing.  
**Problem:** You cannot alert on checkout latency or webhook 503 rate.  
**How it works:** Ad hoc `Logger.warn` on webhook/sweep/audit.  
**Why we need it:** Payments without metrics are operated by hope.  
**Example from this project:** Stripe signature failures are warned.  
**Production considerations:** P1 before serious traffic: JSON logs + checkout/webhook/Stripe counters.

---

## 3. Key traces (how money actually flows)

### Checkout → payment → order → inventory

1. `CheckoutIdempotencyProvider.begin` inserts `(userId, key)` (unique). Loser waits or returns stored response.
2. `CreateCheckoutProvider.createOnce` expires the user’s other pending sessions (`clearForUser`), validates cart **outside** a TX, then:
   - **TX1:** `FOR UPDATE` variants → re-check stock → `adjustVariantStock(..., 'reserve')` → create `CheckoutSession` (`stripePaymentIntentId: 'pending'`) + items + per-store `Order` (`PENDING`) + `Payment` (`PENDING`, `transactionId: 'pending'`).
3. Stripe `paymentIntents.create` with idempotency `checkout:{userId}:{key}` — **outside TX1**.
4. **TX2:** attach PI id to session + payments.
5. Client pays; `CompleteCheckoutProvider` **or** Stripe webhook:
   - Verify PI `succeeded` + amount + metadata.
   - TX: `checkoutSession.updateMany({ status: PENDING → COMPLETED })` as a mutex.
   - Winner: `markSucceededMany` (payments → `SUCCEEDED`) + `cartItem.deleteMany`.
   - **Orders stay `PENDING`.** Paid-ness is payment status. Seller later ships via `UpdateOrderStatusProvider`.

### Stripe webhook

`POST /orders/webhooks/stripe` → `StripeWebhookProvider.handle`:

- Signature verify; **no Stripe event-id table**.
- `payment_intent.succeeded` → `completeFromWebhook` → same complete path (session claim is the idempotency).
- Permanent 4xx (mismatch / not found / forbidden) → **200 ack** (Stripe stops retrying).
- Transient → **503** so Stripe retries.
- `payment_intent.payment_failed` → mark payments `PROCESSING`, **do not** release stock.

### Refresh token rotation

`RefreshTokensProvider.refreshTokens` verifies JWT, looks up hash, then `GenerateTokensProvider.rotateRefreshToken` signs **new** tokens first, then `RefreshTokenStoreProvider.rotate` in a TX: conditional `updateMany` consume + insert new hash. Reuse of a revoked token revokes the **family**.

---

## 4. Schema notes (SQL richer than Prisma)

These exist in Postgres after `migrate deploy` but **not** in `schema.prisma`:

1. CHECK constraints (stock, rating, amounts, order-item quantity)
2. `pg_trgm` extension + GIN indexes on product name/description
3. Partial unique `UQ_checkout_sessions_stripe_pi_not_pending`

Soft-delete (`deletedAt`) exists only on: **User**, **SellerProfile**, **Store**, **Category**, **Product**.

Connection pooling: Prisma 7 `@prisma/adapter-pg` with default `pg` pool (no custom `max` / idle settings).

---

## 5. Architecture-level assessment

### A. What is done well

This is not a tutorial CRUD API. The money path shows real production thinking:

- **Use-case providers** (not fat services), ownership modules, and thin controllers — this matches how serious Nest codebases stay maintainable.
- **Inventory reservation** with sorted `FOR UPDATE`, decrement-at-create, CHECK ≥ 0, and release on cancel/expire — the right model for checkout.
- **Single-winner completion** via `updateMany` so client and webhook cannot both fulfill.
- **Durable checkout idempotency** in Postgres (unique key + stored response), plus Stripe PI idempotency keys.
- **Refresh-token rotation** with hashed tokens, `familyId` reuse detection, and `tokenVersion` for access-token kill.
- **Auth default-deny**, algorithm-pinned HS256, bcrypt cost 12, Joi weak-secret rejection, distinct JWT secrets.
- **File privacy:** magic bytes, path guards, private dirs 404’d, authenticated download with `no-store`.
- **Integer cents** for Stripe/checkout math.
- **Order-item snapshots** and denormalized review stats with a product row lock.
- **SQL-level** CHECKs, partial unique PI index, `pg_trgm` — beyond what Prisma schema can express.
- **Request IDs + ALS audit** on admin/money actions.
- **Webhook signature verification** using `rawBody: true`.
- **Unit tests on the dangerous code** (locks, checkout, webhook ack policy, job lock, money) — better than the backend AGENTS.md claims.

### B. What needs improvement

- **Checkout TX1 → Stripe → TX2** is correct, but `clearForUser` can expire the in-flight session (`stripePaymentIntentId = 'pending'`) and release stock while the customer still pays.
- **Webhook ACK on NotFound** can confirm a paid PI after that expire path.
- **Seller absolute stock overwrite** ignores reserved quantity.
- **Order cancel:** Stripe refund then DB; compensation back to `PENDING` after a successful refund is crash-unsafe.
- **Global `{ data, version }` wrapper** on health, webhook, and **file streams**.
- **In-memory throttler**, default **pg pool of 10**, **local disk** storage — all single-instance assumptions.
- **Helmet defaults** vs cross-origin `/uploads` from the Next app.
- **Observability** is below production standard (no JSON logs, metrics, traces).
- **Prisma schema vs migrations drift** (CHECK, GIN, partial unique).
- **Idempotency hash** omits cart/totals; no key TTL sweeper.
- **Mail From** is `noreply@example.com`; SMTP is not queued.

### C. Important missing concepts (only if they earn their keep)

Worth adding for **this** marketplace, not because they are fashionable:

1. **Paid-PI reconciliation** (do not ACK Stripe success when the session is gone) — P0.
2. **In-flight checkout protection** (one pending session per user **inside** the reservation TX, or refuse to expire `'pending'` PI sessions that are younger than N minutes) — P0.
3. **Skip interceptor** for streams/health/webhooks — P0 for private downloads.
4. **Available vs on-hand stock** (or lock + relative adjust on seller updates) — P0/P1.
5. **Refund/outbox or refund-pending state** for order cancel — P1.
6. **Structured logs + metrics** on checkout, Stripe, TX duration — P1.
7. **Explicit pool settings** and **Redis throttle store** once you run ≥2 replicas — P1.
8. **Object storage (S3/R2)** when you run more than one API instance — P1.
9. **Cursor pagination** for public catalog if offset pages get deep — P2.
10. **Redis/cache** for public product lists — P2 after indexes.
11. **BullMQ** only when you have **many** jobs (mail, webhooks, reports). One locked interval job is enough for now — P2/P3.
12. **OpenTelemetry** — P2.
13. **Fine-grained permissions / CQRS / event bus** — **not** recommended. The current shape is already correct.

### D. Priority roadmap

#### P0 — Critical (fix before real charges in production)

- Stop expiring/clearing checkouts that are still attaching a PaymentIntent; do not release stock in that window.
- Never ACK `payment_intent.succeeded` as permanent if the PI is paid and fulfillment cannot run — complete, compensate (refund), or return 503.
- Exclude `StreamableFile` (and ideally health/webhook) from `DataResponseInterceptor`.
- Stop seller absolute stock writes from clobbering reserved inventory.

#### P1 — High (first production weeks)

- Refund/cancel crash safety (outbox or explicit pending-refund state).
- JSON logs with `requestId`; metrics on checkout/webhook/Stripe errors.
- Log Prisma unmapped 500s and 5xx HttpExceptions.
- Configure `pg` pool + statement timeout.
- Helmet CORP so storefront images work.
- Redis (or similar) throttle store if you scale out.
- Real `MAIL_FROM`; don’t send from `example.com`.
- Document/preserve SQL-only indexes/CHECKs in migration comments.

#### P2 — Medium

- Idempotency hash over cart + shipping; TTL cleanup of `checkout_idempotency_keys`.
- Catalog/payment extra indexes; default-address partial unique.
- Cart add upsert. Refresh-token grace window. Logout by `familyId` from JWT.
- Cursor pagination on public products/orders.
- e2e: create checkout → webhook succeeded → stock and payments.
- Helmet/CSP/Swagger enable-flag cleanup.

#### P3 — Advanced / later

- S3, Redis cache, BullMQ, OpenTelemetry, PgBouncer, Argon2, event inbox table, virus scanning, read replicas.

### E. Scores (out of 10)

| Area | Score | Note |
| ---- | -----: | ---- |
| Database design | 8.0 | Strong FKs, uniques, snapshots, targeted SQL extras |
| Database reliability | 7.0 | Locks/transactions are real; checkout gap + schema drift |
| Backend architecture | 8.5 | Provider/ownership/integrations are the highlight of the repo |
| Security | 7.5 | JWT/files/validation strong; interceptor + throttle/helmet gaps |
| API design | 8.0 | Clear DTOs, default-deny, BFF-friendly envelope |
| Error handling | 7.5 | Consistent envelopes; logging holes on 500 Prisma/Http |
| Background processing | 6.0 | One well-locked sweeper; no queue/outbox |
| Performance | 6.5 | Includes + indexes; no cache; offset counts; pool defaults |
| Scalability | 6.0 | Local disk + in-memory throttle + in-process jobs |
| Observability | 4.0 | Request IDs and health only |
| Maintainability | 8.5 | Best part after architecture; tests on money paths |
| **Overall production readiness** | **6.5** | Architecture is production-grade; **payment/inventory edge cases are not fully closed** |

---

## 6. Bottom line

The backend already implements the hard e-commerce ideas — transactions, `FOR UPDATE`, idempotency keys, webhook vs client mutex, refresh-token families, job TTL locks, soft delete, CHECKs, and a clean Nest module layout. That is well above typical Nest boilerplates.

What keeps this from a “turn on Stripe live tomorrow” score is not missing hexagonal architecture. It is a **small number of concurrency holes on the charge/stock boundary**, plus **ops** (logs, metrics, pool, multi-instance files/throttle) and the **global response interceptor** on binary downloads.

Highest-leverage follow-up work: P0 in-flight checkout protection, webhook ACK policy for paid-but-expired sessions, interceptor skip list, and reserved vs on-hand stock.

---

## 7. Primary source files

| Area | Path |
| ---- | ---- |
| Bootstrap | `server/src/main.ts`, `server/src/app.module.ts` |
| Prisma | `server/prisma/schema.prisma`, `server/src/prisma/prisma.service.ts`, `server/prisma/migrations/` |
| Checkout | `server/src/modules/orders/providers/create-checkout.provider.ts` |
| Idempotency | `server/src/modules/orders/providers/checkout-idempotency.provider.ts` |
| Complete / webhook | `server/src/modules/orders/providers/complete-checkout.provider.ts`, `stripe-webhook.provider.ts` |
| Stock locks | `server/src/modules/orders/utils/lock-product-variants.util.ts`, `adjust-variant-stock.util.ts` |
| Job lock / sweep | `server/src/common/jobs/job-lock.provider.ts`, `expire-abandoned-checkouts.provider.ts` |
| Auth | `server/src/modules/auth/guards/access-token/access-token.guard.ts`, `refresh-token-store.provider.ts` |
| Filters / envelope | `server/src/common/filters/`, `data-response.interceptor.ts` |
| Request context | `server/src/common/middleware/request-id.middleware.ts`, `request-context.ts` |
| Audit | `server/src/common/audit/audit.provider.ts` |
| Config | `server/src/config/environment.validation.ts` |
| Health | `server/src/health/` |
| Files | `server/src/modules/files/providers/secure-file-access.provider.ts` |
