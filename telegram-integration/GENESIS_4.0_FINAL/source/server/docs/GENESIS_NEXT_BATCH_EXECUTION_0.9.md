# GENESIS 3.0 — Next Autonomous Batch 0.9

## P0 — Safe import apply
- Bind a successful preview receipt to authenticated user, payload SHA-256, schema version and expiration.
- Provide explicit `replace` or `merge` mode. No default mutation.
- Generate and verify a full backup before applying.
- Process records in dependency order with transactions, idempotency keys and audit events.
- Surface duplicate IDs, conflicts and dangling references; require explicit resolution for consequential records.

## P1 — Artifact storage and history
- Artifact detail/history view with source and provenance timeline.
- Storage adapter design: private objects, ownership checks, signed access, size/MIME validation, content sniffing and server-side SHA-256.
- No arbitrary URL fetch and no public object access by default.

## P1 — User-controlled retention
- Define separate retention for conversation messages, request traces, audit records, memory versions, provenance and artifacts.
- Show retention status and export coverage to the user.
- Do not delete historical records automatically until the policy is visible and user controls exist.

## P0 — Runtime integration
- Establish a reproducible dependency lockfile and `npm ci`.
- Prisma validate/generate; apply migrations 001–008 to disposable PostgreSQL + pgvector.
- Typecheck, full tests, production build and API integration.
- iOS Safari E2E for local backup/restore, IndexedDB, outbox opt-in/out and offline launch.

## Approval boundaries
External sharing, paid spend, production deployment, irreversible deletion and permission expansion still require explicit user approval.
