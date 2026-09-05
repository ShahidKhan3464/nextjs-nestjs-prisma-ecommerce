# ADR-002: Nest controller → service facade → provider use-cases

## Status

Accepted

## Context

Domain logic spans authz, Prisma transactions, mail, Stripe, and storage. The codebase needs a consistent place for HTTP mapping vs business use-cases without adding extra architectural layers.

## Decision

Each domain module uses:

1. **Controller** — routes, Swagger, roles/decorators
2. **Service** — thin facade that delegates to providers
3. **Providers** — one injectable use-case class per action under `providers/`

Integrations under `src/integrations/` remain thin adapters.

## Why

Historical rationale is not documented. This layout is the dominant pattern across `src/modules/*`.

## Consequences

- New actions should add a provider + service method + controller route, not grow god-services
- Shared ownership checks live in `*-ownership.provider.ts` where already established
- No repository / CQRS / hexagonal layer is part of this project’s architecture

## AI Guidance

- MUST follow controller → service → provider for new Nest features
- MUST NOT introduce repositories, command buses, or ports/adapters “for cleanliness”
- MUST keep controllers thin and services as facades
- SHOULD colocate DTOs, constants, and utils inside the domain module like existing modules

## Related Code

- `server/src/modules/*/providers/`
- Examples: `server/src/modules/sellers/`, `server/src/modules/products/`
- `server/walkthrough.md` (Layout; DTOs & providers)
