# Atelier Commerce — Server Walkthrough

This document describes the **NestJS 11** API under `server/`: module layout, request flow, NestJS patterns, database design, and where each file fits. Paths are relative to `server/` unless noted.

The API serves the Next.js client (BFF at `client/src/app/api/v1/**`) on **port 3001**. PostgreSQL is accessed via **TypeORM**.

---

## Quick orientation

| Piece               | Role                                                     |
| ------------------- | -------------------------------------------------------- |
| `src/app.module.ts` | Root module: TypeORM, config, global guards/interceptors |
| `src/main.ts`       | Bootstrap, ValidationPipe, Swagger, static `/uploads/`   |
| `src/auth/`         | JWT login, refresh, password reset, guards, decorators   |
| `src/users/`        | Registration, profile, admin user management             |
| `src/products/`     | Catalog CRUD, variants, image uploads                    |
| `src/categories/`   | Category CRUD with soft delete                           |
| `src/cart/`         | Per-user cart with variant stock checks                  |
| `src/wishlist/`     | Per-user wishlist sync + toggle                          |
| `src/orders/`       | Checkout (Stripe), orders, status, cancel, refunds       |
| `src/dashboard/`    | Admin analytics + customer dashboard stats               |
| `src/mail/`         | EJS email templates (welcome, reset, order emails)       |
| `src/common/`       | Pagination, file storage, response interceptor           |
| `src/config/`       | App, database, mail, stripe env config + Joi validation  |
| `src/seeders/`      | Bootstrap admin user on startup                          |

---

## Architecture overview

```
HTTP Request
  → Global Guards (Throttler → Authentication → Roles)
    → Controller (route + decorators)
      → Service (thin facade)
        → Provider (business logic, DB, Stripe, mail)
          → TypeORM repositories / transactions
```

**Patterns in use:**

- **Feature modules** — one domain per folder (`products`, `orders`, …).
- **Service → Provider delegation** — controllers call services; services delegate to injectable providers (single-responsibility units).
- **Global auth by default** — all routes require JWT unless `@Auth(AuthType.NONE)`.
- **Uniform API shape** — `DataResponseInterceptor` wraps responses as `{ data, version }`.
- **Polymorphic file storage** — `StoredFile` entity + `file-query.util.ts` joins images to products/users.

---

## Folder structure (`src/`)

```
src/
├── main.ts
├── app.module.ts
│
├── auth/
│   ├── auth.module.ts, auth.controller.ts, auth.service.ts
│   ├── config/jwt.config.ts
│   ├── constants/auth.constants.ts
│   ├── decorators/          # @Auth, @ActiveUser, @Roles
│   ├── dto/                   # login, refresh, forgot/reset password
│   ├── guards/                # Authentication, AccessToken, Roles
│   └── providers/             # login, tokens, hashing, password reset
│
├── users/
│   ├── users.module.ts, users.controller.ts, users.service.ts
│   ├── constants/user.constants.ts
│   ├── dto/                   # create, update-profile, change-password, query
│   ├── entities/user.entity.ts
│   └── providers/             # CRUD, profile, avatar, block, detail
│
├── products/
│   ├── products.module.ts, products.controller.ts, products.service.ts
│   ├── constants/product.constants.ts
│   ├── dto/                   # create, update, query, variant
│   ├── entities/              # product, product-variant
│   ├── pipes/parse-product-images.pipe.ts
│   ├── providers/             # CRUD, images
│   └── validators/unique-variant-sku.validator.ts
│
├── categories/
│   ├── categories.module.ts, categories.controller.ts, categories.service.ts
│   ├── dto/, entities/, providers/
│
├── cart/
│   ├── cart.module.ts, cart.controller.ts, cart.service.ts
│   ├── dto/, entities/cart-item.entity.ts
│   ├── providers/             # get, sync, add, update, remove, clear
│   └── utils/map-cart-item.util.ts
│
├── wishlist/
│   ├── wishlist.module.ts, wishlist.controller.ts, wishlist.service.ts
│   ├── dto/sync-wishlist.dto.ts
│   ├── entities/wishlist-item.entity.ts
│   └── providers/             # get, sync, toggle
│
├── orders/
│   ├── orders.module.ts, orders.controller.ts, orders.service.ts
│   ├── constants/order.constants.ts
│   ├── dto/                   # checkout, cancel, query, status
│   ├── entities/              # order, order-item, checkout-session, checkout-session-item
│   ├── providers/             # checkout, complete, cancel, list, status
│   └── utils/                 # map-order, order-pricing
│
├── dashboard/
│   ├── dashboard.module.ts, dashboard.controller.ts, dashboard.service.ts
│   ├── providers/             # admin + customer dashboard
│   └── utils/dashboard.types.ts
│
├── mail/
│   ├── mail.module.ts         # @Global()
│   ├── providers/mail.service.ts
│   └── templates/             # welcome, reset-password, order-confirmation, order-status-update
│
├── common/
│   ├── files/                 # StoredFile entity, file query joins
│   ├── interceptors/data-response/
│   ├── pagination/            # @Global() pagination helper
│   └── storage/               # multer disk upload, uploads root
│
├── config/
│   ├── app.config.ts, database.config.ts, mail.config.ts, stripe.config.ts
│   └── environment.validation.ts   # Joi schema
│
└── seeders/
    ├── seeders.module.ts
    └── providers/seed-admin.provider.ts
```

---

## Modules, controllers, and routes

### Controllers (9)

| Controller             | Base path    | Key endpoints                                                  |
| ---------------------- | ------------ | -------------------------------------------------------------- |
| `AuthController`       | `auth`       | POST register, login, forgot-password, reset-password, refresh |
| `UsersController`      | `users`      | GET/PATCH me, POST me/avatar; admin GET users, block           |
| `ProductsController`   | `products`   | CRUD, restore, GET by slug                                     |
| `CategoriesController` | `categories` | CRUD, restore                                                  |
| `CartController`       | `cart`       | GET, POST sync, add/update/remove items                        |
| `WishlistController`   | `wishlist`   | GET, POST sync, POST toggle/:productId                         |
| `OrdersController`     | `orders`     | Checkout create/complete/cancel, list, cancel, admin status    |
| `DashboardController`  | `dashboard`  | GET admin, GET customer                                        |

Swagger UI: `http://localhost:3001/api` (Bearer auth scheme `access-token`).

### Services (10)

Each service is a thin facade that injects providers and forwards calls:

| Service               | Providers delegated to                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `AuthService`         | Login, Refresh, Forgot, Reset, GenerateTokens                                                         |
| `UsersService`        | Create, GetUsers, GetUserDetail, UpdateProfile, ChangePassword, Block, UploadAvatar                   |
| `ProductsService`     | Get, Create, Update, Delete, ProductImages                                                            |
| `CategoriesService`   | Get, Create, Update, Delete                                                                           |
| `CartService`         | Get, Sync, Add, Update, Remove, Clear                                                                 |
| `WishlistService`     | Get, Sync, Toggle                                                                                     |
| `OrdersService`       | GetOrders, GetOrder, CreateCheckout, CompleteCheckout, CancelCheckout, CancelOrder, UpdateOrderStatus |
| `DashboardService`    | GetAdminDashboard, GetCustomerDashboard                                                               |
| `MailService`         | Send welcome, reset, order confirmation, status update                                                |
| `PaginationProviders` | Shared offset/limit paging for list endpoints                                                         |

---

## NestJS patterns (where and how)

### Dependency Injection (DI)

| Pattern               | Location                         | Example                                                                         |
| --------------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| Constructor injection | All providers, services, guards  | `@InjectRepository(User)`                                                       |
| Custom provider token | `auth.module.ts`                 | `{ provide: HashingProvider, useClass: BcryptProvider }`                        |
| Config injection      | Providers using env              | `@Inject(jwtConfig.KEY) private jwtConfiguration: ConfigType<typeof jwtConfig>` |
| `forwardRef`          | `AuthModule` ↔ `UsersModule`     | Circular dependency resolution                                                  |
| `@Global()` modules   | `MailModule`, `PaginationModule` | Available without re-import                                                     |

### Guards (global + route-level)

Registered in `app.module.ts` via `APP_GUARD`:

| Guard                 | File                                                 | Behavior                                                                             |
| --------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `ThrottlerGuard`      | `@nestjs/throttler`                                  | 100 requests / 60s default                                                           |
| `AuthenticationGuard` | `auth/guards/authentication/authentication.guard.ts` | Reads `@Auth()` metadata; dispatches to `AccessTokenGuard` or allows `AuthType.NONE` |
| `RolesGuard`          | `auth/guards/roles/roles.guard.ts`                   | Enforces `@Roles('admin')` against `request.user.role`                               |

`AccessTokenGuard` (`auth/guards/access-token/access-token.guard.ts`):

- Extracts Bearer JWT from `Authorization` header
- Verifies token, loads user, rejects blocked accounts

### Decorators

| Decorator              | File                                       | Usage                                                                        |
| ---------------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| `@Auth(AuthType.NONE)` | `auth/decorators/auth.decorator.ts`        | Public routes (all `AuthController` endpoints)                               |
| `@ActiveUser()`        | `auth/decorators/active-user.decorator.ts` | Injects `userId` from JWT `sub` — cart, wishlist, orders, profile, dashboard |
| `@Roles('admin')`      | `auth/decorators/roles.decorator.ts`       | Admin-only: products, categories, users, orders admin, dashboard admin       |

### Pipes

| Pipe                     | File                                          | Usage                                                           |
| ------------------------ | --------------------------------------------- | --------------------------------------------------------------- |
| Global `ValidationPipe`  | `main.ts`                                     | `whitelist`, `transform`, `forbidNonWhitelisted` on all DTOs    |
| `ParseIntPipe`           | Built-in                                      | Route params (`:id`) in controllers                             |
| `ParseProductImagesPipe` | `products/pipes/parse-product-images.pipe.ts` | `@UploadedFiles()` on product create/update — requires ≥1 image |

### Interceptors

| Interceptor               | File                                                             | Usage                                                    |
| ------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| `DataResponseInterceptor` | `common/interceptors/data-response/data-response.interceptor.ts` | Global via `APP_INTERCEPTOR` — wraps `{ data, version }` |
| `FilesInterceptor`        | `@nestjs/platform-express`                                       | Product image upload (up to 12 files)                    |
| `FileInterceptor`         | `@nestjs/platform-express`                                       | Profile avatar upload                                    |

### Other NestJS features

| Feature                                 | Where                                                              |
| --------------------------------------- | ------------------------------------------------------------------ |
| `@Throttle()`                           | Auth routes (register, login, forgot/reset) — stricter rate limits |
| `@ApiTags`, `@ApiBearerAuth`            | Swagger on all controllers                                         |
| `class-validator` + `class-transformer` | All DTOs                                                           |
| Custom validator                        | `UniqueVariantSkuConstraint` on product create/update DTOs         |
| Static assets                           | `main.ts` — serves `uploads/` at `/uploads/`                       |
| Mailer (EJS)                            | `MailModule` — `@nestjs-modules/mailer`                            |

**Not used:** custom exception filters (`@Catch`), WebSockets, GraphQL, CQRS event bus.

---

## Database (TypeORM + PostgreSQL)

### Configuration

`config/database.config.ts` + `TypeOrmModule.forRootAsync` in `app.module.ts`:

| Env variable                                                                                | Purpose                                                   |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME` | Connection                                                |
| `DATABASE_SYNCHRONIZE`                                                                      | Auto-sync schema (dev only; use migrations in production) |
| `DATABASE_AUTO_LOAD_ENTITIES`                                                               | Load entities from feature modules                        |

### Entities (10 tables)

| Entity                | Table                    | File                                              |
| --------------------- | ------------------------ | ------------------------------------------------- |
| `User`                | `users`                  | `users/entities/user.entity.ts`                   |
| `Category`            | `categories`             | `categories/entities/category.entity.ts`          |
| `Product`             | `products`               | `products/entities/product.entity.ts`             |
| `ProductVariant`      | `product_variants`       | `products/entities/product-variant.entity.ts`     |
| `StoredFile`          | `files`                  | `common/files/entities/stored-file.entity.ts`     |
| `CartItem`            | `cart_items`             | `cart/entities/cart-item.entity.ts`               |
| `WishlistItem`        | `wishlist_items`         | `wishlist/entities/wishlist-item.entity.ts`       |
| `Order`               | `orders`                 | `orders/entities/order.entity.ts`                 |
| `OrderItem`           | `order_items`            | `orders/entities/order-item.entity.ts`            |
| `CheckoutSession`     | `checkout_sessions`      | `orders/entities/checkout-session.entity.ts`      |
| `CheckoutSessionItem` | `checkout_session_items` | `orders/entities/checkout-session-item.entity.ts` |

### Relations (ER overview)

```
Category 1──* Product 1──* ProductVariant
User 1──* CartItem *──1 ProductVariant
User 1──* WishlistItem *──1 Product
User 1──* Order 1──* OrderItem *──1 ProductVariant
User 1──* CheckoutSession 1──* CheckoutSessionItem *──1 ProductVariant
StoredFile — polymorphic (ownerModule + ownerId), joined via file-query.util
Product.images — virtual join (not a TypeORM @OneToMany column)
```

### Indexes and unique constraints

| Entity               | Constraint                                | Purpose                   |
| -------------------- | ----------------------------------------- | ------------------------- |
| `User.email`         | `unique: true`                            | One account per email     |
| `Product.slug`       | `unique: true`                            | Canonical PDP URLs        |
| `Product.categoryId` | `@Index()`                                | Faster category filtering |
| `ProductVariant.sku` | `@Index()` + unique                       | SKU lookup, uniqueness    |
| `Order.orderNumber`  | `unique: true`                            | Human-readable order IDs  |
| `CartItem`           | `@Unique(['userId', 'productVariantId'])` | One row per user+variant  |
| `WishlistItem`       | `@Unique(['userId', 'productId'])`        | One row per user+product  |

### Soft deletes

`@DeleteDateColumn` on:

- `Product` (`products/entities/product.entity.ts`)
- `Category` (`categories/entities/category.entity.ts`)

Restore endpoints: `PATCH .../restore` on products and categories.

### Transactions (`dataSource.transaction`)

Used where multiple rows must commit or roll back together:

| Provider                   | File                                             | What happens atomically                                                         |
| -------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `CreateProductProvider`    | `products/providers/create-product.provider.ts`  | Product + variants + file records                                               |
| `CreateCheckoutProvider`   | `orders/providers/create-checkout.provider.ts`   | Checkout session + line items + Stripe PaymentIntent                            |
| `CompleteCheckoutProvider` | `orders/providers/complete-checkout.provider.ts` | Stock decrement, order + items, cart clear, session cleanup, confirmation email |
| `CancelOrderProvider`      | `orders/providers/cancel-order.provider.ts`      | Stock restore, order cancellation, Stripe refund if paid                        |

---

## DTOs and validation

DTOs use `class-validator` decorators and are validated by the global `ValidationPipe`.

### By module

| Module     | DTOs                                                                                                            | Notes                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Auth       | `login`, `forgot-password`, `reset-password`, `refresh-token`                                                   | Throttled endpoints                            |
| Users      | `create-user`, `update-profile`, `change-password`, `query-user`                                                |                                                |
| Products   | `create-product`, `update-product`, `query-product`, `create-product-variant`                                   | Custom `@Validate(UniqueVariantSkuConstraint)` |
| Categories | `create-category`, `update-category`, `query-category`                                                          |                                                |
| Cart       | `add-cart-item`, `sync-cart`, `update-cart-item`                                                                |                                                |
| Wishlist   | `sync-wishlist`                                                                                                 |                                                |
| Orders     | `create-checkout`, `complete-checkout`, `cancel-checkout`, `cancel-order`, `query-order`, `update-order-status` |                                                |
| Common     | `pagination-query`                                                                                              | Extended by list query DTOs                    |

Environment validation: `config/environment.validation.ts` (Joi) — validates all required env vars at startup.

---

## Config modules

| Config   | File                        | Env vars                                                                  |
| -------- | --------------------------- | ------------------------------------------------------------------------- |
| App      | `config/app.config.ts`      | `API_VERSION`, `NODE_ENV`, `FRONTEND_URL`                                 |
| Database | `config/database.config.ts` | `DATABASE_*`                                                              |
| Mail     | `config/mail.config.ts`     | `MAIL_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_SECURE`, `MAIL_PORT` |
| Stripe   | `config/stripe.config.ts`   | `STRIPE_SECRET_KEY`                                                       |
| JWT      | `auth/config/jwt.config.ts` | `JWT_SECRET`, `JWT_ACCESS_TOKEN_TTL`, `JWT_REFRESH_TOKEN_TTL`             |

Loaded in `ConfigModule.forRoot({ load: [appConfig, databaseConfig, mailConfig, stripeConfig], validationSchema: environmentValidation })`.

---

## Auth (JWT flow)

| Step            | Provider / Guard                           | Detail                                                |
| --------------- | ------------------------------------------ | ----------------------------------------------------- |
| Register        | `CreateUserProvider`                       | Hash password, welcome email                          |
| Login           | `LoginProvider` → `GenerateTokensProvider` | Access token (email, role) + refresh token (sub only) |
| API auth        | `AccessTokenGuard`                         | Bearer header verification                            |
| Refresh         | `RefreshTokensProvider`                    | Verify refresh JWT, re-issue pair                     |
| Forgot password | `ForgotPasswordProvider`                   | Short-lived signed JWT in email link                  |
| Reset password  | `ResetPasswordProvider`                    | Verify token, update hash                             |
| Hashing         | `HashingProvider` → `BcryptProvider`       | Abstract + bcrypt implementation                      |

---

## Mail templates

| Method                       | Template                                 | Triggered by            |
| ---------------------------- | ---------------------------------------- | ----------------------- |
| `sendWelcomeEmail`           | `mail/templates/welcome.ejs`             | User registration       |
| `sendResetPasswordEmail`     | `mail/templates/reset-password.ejs`      | Forgot password         |
| `sendOrderConfirmationEmail` | `mail/templates/order-confirmation.ejs`  | Checkout complete       |
| `sendOrderStatusUpdateEmail` | `mail/templates/order-status-update.ejs` | Status update or cancel |

---

## Stripe integration

Injected via `@Inject(stripeConfig.KEY)` in order providers:

| Provider                   | Stripe API                        | Purpose                             |
| -------------------------- | --------------------------------- | ----------------------------------- |
| `CreateCheckoutProvider`   | `paymentIntents.create`           | Create PaymentIntent for cart total |
| `CompleteCheckoutProvider` | `paymentIntents.retrieve`         | Verify amount before order creation |
| `CancelOrderProvider`      | `refunds.create`                  | Refund when cancelling paid order   |
| `CancelCheckoutProvider`   | Lookup by `stripePaymentIntentId` | Abandon checkout session            |

---

## File uploads

| Feature        | Implementation                                                          |
| -------------- | ----------------------------------------------------------------------- |
| Product images | `FilesInterceptor` + `ParseProductImagesPipe` + `ProductImagesProvider` |
| Profile avatar | `FileInterceptor` + `UploadProfileAvatarProvider`                       |
| Storage        | Disk via `common/storage/image-upload.multer.ts` → `uploads/`           |
| DB records     | `StoredFile` entity with `ownerModule` + `ownerId`                      |
| URL joins      | `common/files/file-query.util.ts` — `joinProductImages`, etc.           |

---

## Seeders

| Seeder              | File                                       | Trigger                  |
| ------------------- | ------------------------------------------ | ------------------------ |
| `SeedAdminProvider` | `seeders/providers/seed-admin.provider.ts` | `OnApplicationBootstrap` |

Creates admin user if `ADMIN_EMAIL` + `ADMIN_PASSWORD` are set and user does not exist.

Optional: `ADMIN_NAME`, `ADMIN_PHONE`.

---

## E-commerce domain coverage

| Domain        | Server support                                                                  |
| ------------- | ------------------------------------------------------------------------------- |
| User accounts | Register, login, profile, avatar, block, roles                                  |
| Catalog       | Products, variants (size/color/SKU), categories, soft delete, images            |
| Cart          | Server-side cart with stock validation, guest sync on login (via client)        |
| Wishlist      | Sync + toggle                                                                   |
| Checkout      | Stripe PaymentIntent, checkout sessions, tax/subtotal pricing                   |
| Orders        | Order numbers, status workflow (pending → shipped → delivered), cancel + refund |
| Admin         | User management, analytics dashboard, order status updates                      |
| Email         | Transactional notifications                                                     |

---

## Scripts

```bash
npm run start:dev    # watch mode (port 3001)
npm run build        # compile to dist/
npm run start:prod   # node dist/main
npm run lint         # ESLint
npm run test         # Jest unit tests
npm run test:e2e     # E2E tests
```

---

## Request flow (checkout example)

1. **POST `/orders/checkout`** — `CreateCheckoutProvider` loads cart, validates stock, calculates pricing, creates `CheckoutSession` + items in a **transaction**, creates Stripe PaymentIntent, returns `clientSecret`.
2. Client completes payment in Stripe Elements.
3. **POST `/orders/checkout/complete`** — `CompleteCheckoutProvider` verifies PaymentIntent, decrements variant stock, creates `Order` + `OrderItem` rows, clears cart, deletes session — all in a **transaction**; sends confirmation email.
4. Admin **PATCH `/orders/:id/status`** — `UpdateOrderStatusProvider` updates status, sends status email.
5. Customer or admin **POST cancel** — `CancelOrderProvider` restores stock, refunds if paid — in a **transaction**.

---

## Recommendations (non-blocking)

These are documentation notes, not required changes:

1. **Production DB:** Replace `synchronize: true` with TypeORM migrations before deploying.
2. **Remove debug:** `auth.controller.ts` has a `console.log` on refresh — safe to remove.
3. **Filename typo:** `bycrypt.provider.ts` works but could be renamed to `bcrypt.provider.ts` for clarity.
4. **Tests:** Jest is configured but domain coverage appears minimal — add integration tests for checkout and cancel flows.
5. **README.md:** Still the default Nest starter — this `walkthrough.md` is the project-specific doc.
