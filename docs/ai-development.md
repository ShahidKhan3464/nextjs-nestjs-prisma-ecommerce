# AI-assisted development guide

Practical workflows for Cursor / Claude Code / similar agents on this monorepo.

Instruction hierarchy:

1. [AGENTS.md](../AGENTS.md) (global)
2. [client/AGENTS.md](../client/AGENTS.md) or [server/AGENTS.md](../server/AGENTS.md)
3. Walkthrough sections ([client](../client/walkthrough.md), [server](../server/walkthrough.md))
4. This file + [docs/decisions/](./decisions/)
5. Actual source code (final reality)

> Documentation describes the intended/current architecture, but **source code is the final implementation reality**. If docs and code disagree: report it, follow the user’s explicit task, and update docs only when the change is intentional.

---

## Reference Implementations

When implementing a new feature, first look for an existing feature with similar responsibilities and follow its real implementation pattern. Prefer copying a proven pattern over inventing a new architecture.

### Backend reference: `server/src/modules/products`

**Why this module:**

- Clear controller roles (`SELLER` mutations, public reads)
- Thin `products.service.ts` facade
- Use-case providers including lifecycle (publish/archive/delete/restore)
- Explicit `product-ownership.provider.ts` (store resolution, approved seller, suspended store gates)
- DTOs, constants, validators, pipes colocated in-module

Also study **`server/src/modules/sellers`** when the feature involves multi-vendor onboarding, admin approve/reject, or private documents.

### Frontend reference: `client/src/modules/seller/products`

**Why this module:**

- Full feature folder: `components/`, `services/`, `schemas/`, `hooks/`, `types`, `utils/`, `index.ts`
- TanStack Query + Axios services targeting `/api/v1/seller/...`
- Zod forms (create/edit/variants)
- Matching BFF under `client/src/app/api/v1/seller/products*` and variants
- Demonstrates seller-owned catalog UX (including pages under `(admin)` route group for layout reuse)

Also study **`client/src/modules/admin/seller-profiles`** + **`client/src/modules/customer/seller-registration`** for admin moderation and buyer onboarding patterns.

---

## Workflows

### A. New Feature

1. Understand requirements and acceptance criteria
2. Locate relevant architecture (client vs server vs both)
3. Find the closest existing feature/module (start with references above)
4. Read only the relevant walkthrough sections
5. Check relevant ADRs under `docs/decisions/`
6. Inspect affected Prisma models / relations if persistence changes
7. Propose a short implementation approach that mirrors an existing pattern
8. Wait for confirmation before large architectural changes
9. Implement the minimum required files
10. Run the smallest relevant verification
11. Summarize changes, risks (esp. ownership/authz), and verification run

### B. Bug Fix

1. Reproduce / understand the bug (do not patch blindly)
2. Locate the root cause in the real request flow (page → BFF → Nest → provider → Prisma, as applicable)
3. Inspect authorization / ownership / security implications
4. Make the smallest safe fix
5. Add or update a regression test where appropriate
6. Run relevant checks
7. Explain root cause and fix

AI must **not** immediately modify code before understanding the root cause.

### C. Refactoring

- Explain why refactoring is needed
- Identify affected dependencies (modules, BFF, clients)
- Avoid behavior changes unless explicitly in scope
- Prefer incremental changes
- Run relevant tests/lint on touched areas

### D. Database Change

- Inspect current `server/prisma/schema.prisma` and relations
- Inspect existing migrations under `server/prisma/migrations/`
- Identify affected Nest modules and ownership rules
- Identify API + client/BFF impact
- Consider backward compatibility / data backfill
- Avoid destructive changes unless explicitly requested
- Generate migrations with existing scripts (`npm run prisma:migrate:dev` / `prisma:migrate:deploy`)
- Update seeders only when required by the task

---

## Standard prompt structure

Prefer prompts that reference specific modules/files over attaching the entire repository.

```md
## Task

What needs to be done?

## Context

Relevant modules/files.

## Requirements

Exact functional requirements.

## Constraints

What must not change?

## Existing Patterns

Which existing feature/module should be followed?

## Acceptance Criteria

How do we know the task is complete?

## Verification

What should be tested?
```

---

## Context / token optimization

Goal: **minimum sufficient context, not maximum context.**

```text
LEVEL 1  Global rules          → AGENTS.md
LEVEL 2  Area rules            → client/AGENTS.md or server/AGENTS.md
LEVEL 3  Relevant docs         → walkthrough section(s) only
LEVEL 4  Similar feature       → reference module / closest neighbor
LEVEL 5  Relevant ADRs         → docs/decisions/*
LEVEL 6  Schema / API files    → Prisma models, controllers, BFF routes
LEVEL 7  Broader repo context  → only when necessary
```

### When to use broad codebase dumps (e.g. Repomix)

Use broad packaging/analysis tools for:

- Architecture reviews across many modules
- Large refactors
- Unfamiliar domains where you cannot yet name the right module

Do **not** treat Repomix (or equivalent full-repo dumps) as mandatory context for small, localized tasks.

---

## Automated enforcement vs documentation

| Layer | Role |
|-------|------|
| Documentation (walkthroughs, ADRs) | Explains the rule |
| AI instructions (`AGENTS.md`, area guides) | Reminds agents of the rule |
| Lint / tests / CI | Enforce the rule when configured |

### What is already enforced (today)

| Area | Mechanism |
|------|-----------|
| Client lint | ESLint `next/core-web-vitals` + `next/typescript` + Prettier (`client/eslint.config.mjs`) |
| Server lint | `typescript-eslint` recommendedTypeChecked + Prettier (`server/eslint.config.mjs`) |
| Client types | TypeScript `strict: true` |
| Server types | TS with `strictNullChecks`; `noImplicitAny` is **off** |
| Client unit tests | Vitest (thin coverage today; e.g. checkout service test) |
| Server unit/e2e | Jest scripts in `package.json`; **no** checked-in `*.spec.ts` or project `test/` e2e harness today |
| Env validation (server) | Joi in `server/src/config/` |
| Nest request validation | Global `ValidationPipe` in `main.ts` (whitelist / forbidNonWhitelisted) |
| Authz (runtime) | Nest `AuthenticationGuard` / `RolesGuard` / ownership providers; Next middleware + BFF `require*` helpers |

**No project-level CI workflows** were found at the repo root (no `.github/workflows` for this app). There is **no** ESLint boundary/import-restriction plugin configured for module walls.

### Important rules documented but not automatically enforced

Consider (do not implement unless requested):

1. **Import / dependency boundaries** — e.g. forbid feature modules from treating Nest as a browser API base; optional `eslint-plugin-import` or `dependency-cruiser`
2. **BFF-only business APIs** — convention + ADR-001 (public `/uploads` assets are a deliberate exception)
3. **Ownership / role invariants** — enforced at runtime in providers/guards, not by static analysis
4. **Test requirements for critical paths** — payments, checkout, ownership; coverage is thin / largely absent on server
5. **CI pipeline** — lint + typecheck + unit tests on PR would harden the AI/docs layer
6. **Knip** — `client/knip.json` exists but unused-export enforcement is not wired into the documented npm scripts as a gate

---

## Multi-vendor caution

Before changing seller/store/product/variant ownership, admin vs seller responsibilities, payments, orders, inventory, private files, customer data, or webhooks:

1. Inspect the existing providers/guards/BFF
2. Read matching ADRs (especially 003, 004, 007, 008)
3. Do not invent or weaken security behavior casually

Project-specific pitfalls:

- Admin payment refunds **track** refunds in DB — they do **not** call Stripe
- COD confirm/reject allow `SELLER` and `SUPER_ADMIN` on Nest
- Shared `/products` page: `isSeller(session)` → seller catalog UI; otherwise customer catalog (admins are not product editors)
- Private upload subdirs are only `sellers` and `customer-documents`
