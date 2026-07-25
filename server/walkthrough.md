# Multi-Vendor E-Commerce — Server Architecture

NestJS API under `server/` (default port **3001**). PostgreSQL via **Prisma 7**. Paths below are relative to `server/` unless noted.

## Layout (`src/`)

```text
src/
├── modules/           # Business domains (auth, users, sellers, stores, products, …)
├── integrations/      # External adapters (mail, stripe, storage)
├── common/            # Cross-cutting Nest utilities (guards, filters, pagination, crypto, swagger)
├── config/            # Env namespaces + Joi validation
├── prisma/            # PrismaModule / PrismaService
├── generated/prisma/  # Generated client (do not edit)
├── health/            # Liveness / readiness
├── seeders/           # Admin + optional demo seed on bootstrap
├── main.ts
└── app.module.ts
```

## Request flow

```text
HTTP → ThrottlerGuard → AuthenticationGuard → RolesGuard
  → Controller → Service (facade) → Provider (use-case)
    → Prisma / MailService / StripeService / STORAGE_PROVIDER
```

Responses are wrapped by `DataResponseInterceptor` as `{ data, version }`.

## Integrations

| Path | Role |
|------|------|
| `integrations/mail/` | SMTP + EJS templates (`MailService`) |
| `integrations/stripe/` | Shared Stripe SDK client (`StripeService`) |
| `integrations/storage/` | Local disk storage + `STORAGE_PROVIDER` |

Domain modules own business rules; integrations stay thin adapters.

## Domain modules

All live under `src/modules/` (plural folder names where applicable):

`auth`, `users`, `sellers`, `stores`, `categories`, `products`, `product-variants`, `carts`, `wishlists`, `orders`, `payments`, `reviews`, `files`, `notifications`, `dashboard`.

## Cross-cutting

| Path | Role |
|------|------|
| `common/crypto/` | Password hashing (`HashingProvider` → bcrypt) |
| `common/prisma/` | Shared Prisma select/include helpers |
| `common/swagger/` | Swagger setup + extra models |
| `common/pagination/` | Shared pagination |

## Docs / tooling

- OpenAPI UI: `/api` (disabled in production unless `SWAGGER_ENABLED=true`)
- Static uploads: `/uploads/` (private subdirs blocked; secure files via `/files/secure/:id`)
- Env template: `.env.example`

For deeper domain behavior, start from the relevant module under `src/modules/` and its `providers/` folder.
