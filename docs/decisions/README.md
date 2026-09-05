# Architectural Decision Records (ADRs)

ADRs capture **important, durable decisions** that AI agents and developers should not silently reverse.

## What an ADR is

A short record of a decision that shapes architecture, boundaries, security, or API contracts — with enough context that future changes are intentional.

## When to create one

Create an ADR when:

- Introducing or changing a cross-cutting pattern (auth, response shape, BFF, ownership)
- Changing module boundaries or who owns a domain (seller vs admin)
- Making a choice that future AI sessions are likely to “optimize away”
- Documenting a non-obvious constraint already enforced in code

## When NOT to create one

Do not create an ADR for:

- Local implementation details or one-off bug fixes
- Obvious framework defaults already clear from code
- Temporary experiments
- Restating the entire walkthrough

Prefer updating an existing ADR over proliferating near-duplicates.

## How AI should use ADRs

1. Before architectural or ownership/security changes, scan `docs/decisions/` for related ADRs
2. Follow **AI Guidance** in matching ADRs
3. If a task conflicts with an ADR, stop and confirm with the user — do not silently override
4. If code and ADR disagree, report the discrepancy (code is runtime reality; update ADR only when the change is intentional)

## Index

| ADR | Title |
|-----|-------|
| [ADR-001](./001-bff-architecture.md) | Next.js BFF for business APIs (public `/uploads` assets excepted) |
| [ADR-002](./002-controller-service-provider.md) | Nest controller → service facade → provider use-cases |
| [ADR-003](./003-seller-owned-products.md) | Product catalog mutations are seller-owned |
| [ADR-004](./004-seller-onboarding.md) | Multi-vendor seller onboarding flow |
| [ADR-005](./005-api-response-envelope.md) | Nest `{ data, version }` vs client BFF `{ data, meta? }` |
| [ADR-006](./006-custom-jwt-auth.md) | Custom JWT authentication (not Clerk) |
| [ADR-007](./007-file-privacy.md) | Public uploads vs private secure files |
| [ADR-008](./008-ownership-providers.md) | Domain ownership providers |
