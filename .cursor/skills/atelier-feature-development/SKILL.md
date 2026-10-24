---
name: atelier-feature-development
description: >-
  Guides feature work in the Atelier Commerce monorepo (Next.js client and BFF,
  NestJS API, Prisma). Use when implementing a new feature, extending or
  modifying existing behavior, or changing client UI, BFF routes, Nest modules,
  authorization, ownership, or database-backed API behavior. Loads only the
  relevant AGENTS.md, walkthrough section, and ADR, then investigates, plans,
  implements, verifies, and reports.
---

# Atelier feature development

Repeatable procedure for a **new feature** or a **change to an existing feature**. It does not replace project rules.

| Document | Responsibility |
| --- | --- |
| `AGENTS.md`, `client/AGENTS.md`, `server/AGENTS.md` | Rules and constraints |
| `client/walkthrough.md`, `server/walkthrough.md` | Maps of the existing application. Indexes also live under `docs/walkthrough/` and point at those files |
| `docs/decisions/` | Architectural decisions and why they stand |
| `docs/ai-development.md` | Context loading, reference implementations, workflows A–D |
| This skill | The sequence for completing the task |

Read those files when a step below says to. Do not paste them into the change, and do not override them.

If documentation and source disagree, report the discrepancy. Follow the user's task. Treat source as runtime behavior. Update documentation only in Step 7.

## 1. Understand the request

- Identify the requested behavior, requirements, constraints, and expected outcome.
- Identify the relevant frontend, backend, database, and API areas.
- Ask a concise clarification question only when an essential requirement is ambiguous.
- Avoid unnecessary questions when the task can reasonably proceed.

Classify the work:

- **New feature** — no current flow to preserve; follow the closest existing pattern.
- **Modify or extend** — a current flow exists; trace it before editing.
- **Bug fix, refactor, or schema change** — use the matching workflow in `docs/ai-development.md` (B, C, or D) together with the steps below.

## 2. Load relevant project context

Follow root `AGENTS.md`, then only the area documents this task needs. Do not read the whole repository.

| Task touches | Load |
| --- | --- |
| Client UI, routing, state, or BFF | `client/AGENTS.md`, then the matching section of `client/walkthrough.md` (section index is in that `AGENTS.md`) |
| Nest API, Prisma, auth, files, or payments | `server/AGENTS.md`, then the matching section of `server/walkthrough.md` |
| Both sides of one flow | Both area guides, and only the walkthrough sections for that flow |
| Architecture, ownership, auth, response shape, or file privacy | The matching ADR in `docs/decisions/` (index: `docs/decisions/README.md`) before editing |
| Where to look, or how much context to load | The relevant section of `docs/ai-development.md` |

If the task conflicts with an ADR, stop and confirm with the user. Do not silently override it.

## 3. Investigate existing code

- Find the closest existing feature or implementation pattern. When nothing closer is obvious, start from the reference implementations named in `docs/ai-development.md` and confirm they still match the code.
- **New feature:** trace that neighbor's request flow and mirror it.
- **Existing feature:** trace the flow being changed, including callers that must keep working.
- Include only the hops this task uses: page, module service, BFF route, Nest controller, service, provider, Prisma.
- Inspect related API contracts, DTOs, validation, authentication, authorization, ownership rules, database models, and tests where applicable.
- Verify important assumptions against the actual source code.
- Prefer extending established patterns over introducing unnecessary abstractions or new architectural styles.

## 4. Plan the implementation

- Summarize the proposed changes before making substantial modifications.
- Identify the files and layers likely to be affected.
- Consider backward compatibility, security, validation, error handling, loading states, caching, and data consistency where relevant.
- Keep the solution focused on the requested task.
- Do not create a large plan for a small, straightforward change.

For a large architectural change, state the approach and wait for confirmation, as in workflow A of `docs/ai-development.md`.

## 5. Implement according to project architecture

Apply the rules loaded in Step 2. The notes below are reminders to check those sources, not a second copy of them.

- Frontend work follows the current Next.js, React, TanStack Query, Zustand, Axios, Zod, and UI conventions in `client/AGENTS.md` and the closest feature module.
- Backend work follows NestJS, Prisma, and PostgreSQL, with the existing controller → thin service → provider/use-case structure in `server/AGENTS.md`.
- Browser-facing JSON and auth go through the Next.js BFF (`/api/v1/*`) to the Nest API. Do not call Nest business APIs from the browser.
- Preserve authentication, authorization, resource ownership, and seller/admin responsibility boundaries.
- Follow existing response contracts, validation patterns, soft-delete behavior, and public/private file-access rules.
- Do not introduce repositories, CQRS, hexagonal architecture, or other layers that conflict with this project's design.
- Do not bypass existing security or architecture rules to make an implementation easier.
- Do not make unrelated refactors or modify generated files unnecessarily (`server/src/generated/prisma/` is generated).

Check current instructions, the relevant ADRs, and the source before relying on these reminders.

## 6. Test and verify

- Inspect available scripts and testing conventions before running commands (`client/package.json`, `server/package.json`, and the verification table in root `AGENTS.md`).
- Run relevant tests, type checks, linting, or builds when appropriate and feasible. Prefer the smallest check that covers the change.
- Add or update tests for changed behavior when the project has a suitable testing setup. Read the Testing section of the area `AGENTS.md` before assuming coverage already exists.
- Check affected call sites and integration points.
- Report commands that passed, failed, or could not be run.
- Never claim that code is tested or working unless the relevant verification was actually performed.
- Do not hide failures or silently ignore regressions.

Read each script before running it. If it applies automatic fixes (server `lint` is one to check), review the resulting diff before finishing.

## 7. Review the final changes

- Review the diff for unintended modifications.
- Check that the implementation satisfies the original requirements.
- Check for security, authorization, data-contract, and architecture violations.
- Update documentation only when the changes make existing documentation inaccurate or when documentation is needed to explain a meaningful change.
- Recommend a new ADR only when the change introduces or materially alters an architectural decision. Do not create ADRs for routine feature work. Criteria: `docs/decisions/README.md`.

## 8. Report the outcome

Finish with:

1. What was implemented.
2. Which important files were changed.
3. How the implementation follows the existing architecture.
4. Which tests and verification commands were run and their actual results.
5. Any remaining risks, limitations, or follow-up work.
