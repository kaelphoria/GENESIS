# GENESIS 3.0 — Next Autonomous Batch 0.8

## P0 — Import apply protocol
- Build a separate apply endpoint that requires a successful preview receipt bound to the authenticated user and exact payload hash.
- Require explicit `replace` or `merge` intent; no implicit destructive default.
- Create a restorable safety backup before applying; use idempotency keys and transaction boundaries.
- Resolve foreign-key graph topologically and show conflicts for duplicate IDs, profile versions, memory versions, decisions and provenance.
- Audit import preview and apply separately.

## P1 — Artifact storage
- Define private storage adapter and ownership-aware signed access.
- Enforce maximum bytes, MIME allowlist, content sniffing, malware scanning hook and server-computed SHA-256.
- Keep storage URI private; never fetch arbitrary user URLs server-side.
- Add artifact versioning, provenance, export manifest and retention controls.

## P1 — Retention and operations
- Define retention by record class and user export/deletion semantics.
- Cleanup stale rate buckets and expired failed/completed chat request records without deleting user messages.
- Add health checks for database, pgvector, provider configuration and outbox queue depth.
- Add structured trace IDs and sanitized error codes only.

## P0 — Release gate
- Lockfile + `npm ci`.
- Prisma validate/generate and apply migrations 001–008 on disposable PostgreSQL + pgvector.
- Typecheck, 92+ contract tests, Next production build, API integration and browser E2E.
- iOS Safari tests for IndexedDB recovery, backup/import preview, offline and consent controls.

## Boundaries
No external data transfer, paid spend, production deployment, irreversible deletion or permission expansion without explicit user approval.
