# GENESIS 3.0 — Next Autonomous Batch 0.7

## P0 — Artifact lifecycle
- Add artifact metadata create/read/update/archive endpoints.
- Attach artifacts to owned projects and optional sources.
- Compute SHA-256 only from trusted uploaded bytes; never accept a client-provided hash as verified.
- Define storage adapter interface, private access policy, content type/size limits and retention metadata before enabling uploads.

## P1 — Portable account import
- Validate `genesis.account-export` format/schema version.
- Produce a dry-run report: counts, unsupported versions, malformed records, duplicate IDs, dangling relations and ownership conflicts.
- Require explicit replacement/merge selection; default to no mutation.
- Create a verified safety backup before applying import; make operation idempotent and auditable.

## P1 — Provider economics
- Versioned pricing table with provider, model, token class, effective date and currency.
- Calculate cost only when a precise matching rate exists; otherwise show unknown.
- Preserve actual provider usage and model metadata per agent stage.

## P1 — Operations
- Cleanup stale rate-limit buckets and expired request records under retention policy.
- Audit retention, memory version retention and user export/deletion coverage.
- Health diagnostics for database, embeddings, provider connectivity and sync outbox depth.
- Structured logs contain trace IDs and sanitized error codes only, never prompts, context, credentials or vectors.

## P0 — Release gate
- Lockfile + `npm ci`.
- Prisma validation/client generation and migration application to disposable PostgreSQL + pgvector.
- Typecheck, all tests, production build, API integration and browser E2E.
- iOS Safari PWA backup/restore, offline, IndexedDB quota and sync consent tests.

## Approval boundaries
No external data transfer, paid provider spend, production deployment, irreversible deletion or expanded permissions without explicit user approval.
