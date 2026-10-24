# AGENTS.md — Prisma Ecommerce (Atelier Commerce)

Global instructions for AI coding agents. Keep this file concise; load area docs only when needed.

## Project Overview

Multi-vendor e-commerce monorepo:

| Path | Role |
|------|------|
| `client/` | Next.js 15 storefront + BFF (JSON/auth via `/api/v1`; Nest for public `/uploads` assets only) |
| `server/` | NestJS API + Prisma 7 + PostgreSQL |

Brand: **Atelier Commerce**. Roles: `BUYER` \| `SELLER` \| `SUPER_ADMIN`.

## Core AI Principles

Agents MUST:

- Inspect existing code before modifying it
- Follow the existing architecture (do not redesign)
- Reuse existing patterns, modules, utilities, and mappers
- Prefer minimal, focused changes; avoid unrelated refactors
- Avoid inventing APIs, DB fields, roles, or business rules
- Preserve existing behavior unless the task explicitly requires a change
- Check relevant walkthrough sections and ADRs before architectural changes
- Verify changes after implementation with the smallest relevant checks

Agents MUST NOT:

- Introduce repository / CQRS / hexagonal / Clean Architecture layers
- Call Nest **business APIs** from the browser (JSON/auth traffic goes through the Next BFF under `/api/v1/*`)
- Casually change ownership, authz, payments, inventory, or file privacy
- Blindly trust documentation when it conflicts with source code

Note: public upload **assets** may be loaded from Nest `/uploads/**` (see `resolveUploadUrl` / Next image `remotePatterns`). That does not replace the BFF for API calls. Private files must use secure file endpoints, not public `/uploads`.

## Context Loading

Do **not** load the entire repository by default. Use layered context:

1. This file (`AGENTS.md`)
2. `client/AGENTS.md` or `server/AGENTS.md` for the area you are changing
3. Relevant section of `client/walkthrough.md` or `server/walkthrough.md`
4. Closest existing feature/module (see [docs/ai-development.md](docs/ai-development.md))
5. Relevant ADR under [docs/decisions/](docs/decisions/)
6. Affected schema / API / BFF files
7. Broader repo context only when necessary (large refactors, unfamiliar domains)

**Minimum sufficient context, not maximum context.**

## Documentation vs Code

Documentation describes intended/current architecture; **source code is the final reality**.

If docs and code disagree:

1. Detect and report the discrepancy
2. Do not silently pick one
3. Follow the user’s explicit task requirement
4. Update documentation only when the architectural change is intentional

## Change Safety

Before significant changes, identify:

- Affected modules / features
- Affected APIs (Nest controllers + client BFF routes)
- Affected Prisma models / migrations
- Authorization and ownership implications
- Related tests
- Relevant ADRs

### Multi-vendor caution

Be especially careful with seller/store/product/variant ownership, admin vs seller responsibilities, payments, orders, inventory, private files, customer data, and webhooks. Inspect existing ownership providers and role guards before changing these areas.

## Verification

After implementation, run the **smallest relevant** verification:

| Change scope | Typical checks |
|--------------|----------------|
| Tiny client fix | Targeted Vitest / lint on touched files if available |
| Client feature | `cd client && npm run lint` (+ `npm run test` if tests exist) |
| Tiny server fix | Relevant Jest `*.spec.ts` if present |
| Server feature | `cd server && npm run lint` (+ `npm run test`) |
| Schema change | Prisma migrate conventions + affected module tests |
| Cross-cutting | Build only when relevant (`npm run build`) |

Do not blindly run every expensive command for every tiny change.

## Key References

| Doc | Purpose |
|-----|---------|
| [client/AGENTS.md](client/AGENTS.md) | Frontend-only AI rules |
| [server/AGENTS.md](server/AGENTS.md) | Backend-only AI rules |
| [client/walkthrough.md](client/walkthrough.md) | Detailed client architecture |
| [server/walkthrough.md](server/walkthrough.md) | Detailed server architecture |
| [docs/ai-development.md](docs/ai-development.md) | Workflows, prompts, context strategy |
| [docs/decisions/](docs/decisions/) | Architectural Decision Records |

Cursor: project rules under `.cursor/rules/` point here as the source of truth — do not duplicate large instruction blocks into Cursor rules.
