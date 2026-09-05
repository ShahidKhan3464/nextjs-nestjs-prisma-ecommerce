# server/AGENTS.md — Backend AI Instructions

Backend-only rules for the NestJS API. Global rules: [../AGENTS.md](../AGENTS.md).

**Detailed architecture:** [walkthrough.md](./walkthrough.md) — read the relevant section; do not assume this file replaces it.

## Stack

- NestJS 11, TypeScript, Prisma 7, PostgreSQL
- Auth: `@nestjs/jwt` + bcrypt — **not** Clerk
- Validation: `class-validator` + global `ValidationPipe` (whitelist, transform, forbidNonWhitelisted)
- Responses: `DataResponseInterceptor` → `{ data, version }` (`API_VERSION` is envelope version only)
- No global URL prefix — controllers mount at root (`/auth`, `/products`, …); Next BFF remaps under `/api/v1/{role}/…`
- Integrations: `src/integrations/{mail,stripe,storage}` (thin adapters)

## Architecture (must preserve)

```text
HTTP → middleware/guards → Controller → Service (thin facade) → Provider (use-case) → Prisma / integrations
```

Typical module layout:

```text
src/modules/<name>/
├── *.module.ts
├── *.controller.ts
├── *.service.ts          # Thin facade — delegates only
├── providers/            # One use-case class per action (+ *-ownership.provider.ts)
├── dto/
├── constants/
├── utils/
└── (optional) types/, pipes/, interceptors/, validators/
```

Do **not** introduce a repository layer, CQRS, or hexagonal ports/adapters unless the project already has them (it does not).

## Key paths

| Path | Role |
|------|------|
| `src/modules/` | Domain modules (auth, users, sellers, stores, products, …) |
| `src/common/` | Guards, filters, pagination, crypto, swagger, utils |
| `src/integrations/` | Mail, Stripe, storage |
| `src/config/` | Env namespaces + Joi validation |
| `src/prisma/` | PrismaModule / PrismaService |
| `prisma/schema.prisma` | Schema + migrations under `prisma/migrations/` |
| `src/generated/prisma/` | Generated client — **do not edit** |

## Conventions

### Controllers

- HTTP mapping, Swagger decorators, `@Roles`, `@Auth`, `@ActiveUser`
- Keep thin — call the service; no heavy business logic
- `@ActiveUser()` with no key returns the **user id (`number`)** from JWT `sub` (not a full user entity). Use `@ActiveUser('roles')` (etc.) when a claim is needed.

### Services

- Injectable facade wiring providers
- One method ≈ one provider call

### Providers

- One class per use-case under `providers/`
- Ownership checks via `*-ownership.provider.ts` where the domain already uses them (products, variants, stores, orders, payments, reviews, addresses, notifications). Not every module has one (e.g. carts/wishlists scope by authenticated `userId` in the use-case).
- Domain modules own business rules; integrations stay adapters

### DTOs

- Create / Update / Query / Response naming
- Updates often `PartialType(CreateXDto)`
- `@ApiProperty` / Optional for Swagger
- Multipart: `@ApiConsumes('multipart/form-data')` + existing multer helpers

### Auth & authorization

- Bearer required unless `@Auth(AuthType.NONE)`
- Global guards: `AuthenticationGuard` (auth module), `RolesGuard` (`common`), `ThrottlerGuard` (app module)
- `@Roles(...)` via `RolesGuard`; no `@Roles` → any authenticated user when bearer is required
- Multi-role via `UserRole` join table
- Soft-deleted / blocked users rejected by access-token guard

### Prisma & data

- Soft deletes (`deletedAt`) on: `User`, `SellerProfile`, `Store`, `Category`, `Product`
- `ProductVariant` and most other models are **not** soft-deleted (variants use hard delete)
- Migrations: `npm run prisma:migrate:dev` / `prisma:migrate:deploy`
- Avoid destructive schema changes unless explicitly requested

### Errors & responses

- Throw Nest HTTP exceptions; filters under `src/common/filters/`
- Success bodies wrapped as `{ data, version }` — do not invent a parallel Nest envelope
- Client BFF responses use `{ data, meta? }` after unwrap/map — do not assume the browser sees Nest `version`

### Files

- Public static: `/uploads/*` (e.g. `products`, `stores`, `customers`)
- Private static subdirs blocked (404): `sellers`, `customer-documents` — use `/files/secure/:fileId`
- Seller documents and private customer documents must stay private

### Payments (do not invent behavior)

- Admin `POST /payments/:id/refunds` **records** refund amounts in DB — it does **not** call Stripe
- COD confirm/reject: `@Roles(SELLER, SUPER_ADMIN)` on Nest

### Testing

- Jest scripts exist (`npm run test`, `test:e2e` in `package.json`)
- Currently **no** checked-in `src/**/*.spec.ts` and **no** project `test/` e2e harness — add tests beside new logic when appropriate; do not assume coverage already exists
- Scripts: `npm run lint`, `npm run test`, `npm run build`

### Naming

- Providers: `create-*.provider.ts`, `*-ownership.provider.ts`
- Prefer existing module naming (`seller.controller.ts`, `products.controller.ts`)
- Sellers module exposes **two** controllers: `seller-profile` (buyer/seller + admin actions on `:id`) and `seller-profiles` (admin list)

## Seller / ownership rules (critical)

- Product catalog **mutations** are **seller-owned** — no `SUPER_ADMIN` create/update/publish/archive on products
- Product create binds to the authenticated seller’s store via `ProductOwnershipProvider` (do not add client-chosen store ownership)
- Admin store moderation is verify / suspend (and counterparts) — not generic admin PATCH/DELETE on stores
- Approving a seller profile creates an `ACTIVE` store (with `verifiedAt` set), grants `SELLER` role, and notifies — do not reimplement ad hoc

## Before Creating a New Backend Feature

1. Find the closest existing module under `src/modules/`
2. Inspect its controller (routes + roles)
3. Inspect its service (facade)
4. Inspect its providers / ownership provider
5. Inspect DTOs
6. Inspect related Prisma models
7. Inspect authorization / ownership logic
8. Check relevant ADRs under `../docs/decisions/`
9. Follow the existing pattern
10. Implement only what is required

**Backend reference implementation:** `src/modules/products` (ownership + seller lifecycle). For multi-vendor onboarding, also study `src/modules/sellers`. See [../docs/ai-development.md](../docs/ai-development.md).

## Walkthrough map (load only what you need)

| Topic | Walkthrough section |
|-------|---------------------|
| Module catalog | Domain modules |
| Auth / tokens / guards | Auth & authorization |
| Endpoint list | API endpoints |
| Prisma models | Database (Prisma) |
| Provider/DTO style | DTOs & providers |
| Env | Environment |

## Do not

- Put business rules only in controllers or inflate services into god-classes
- Call Stripe/mail/storage business logic from random modules without following existing integration usage
- Expose private uploads via public static paths
- Change ownership or role checks casually
