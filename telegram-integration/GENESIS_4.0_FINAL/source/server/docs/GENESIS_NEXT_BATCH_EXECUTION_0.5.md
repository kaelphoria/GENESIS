# GENESIS 3.0 — Next Autonomous Batch 0.5

## P0 — Finish the canonical domain layer
- Source and provenance records with immutable origin metadata, content hashes, trust labels and timestamps.
- Link memory records and artifacts to source/provenance records.
- Artifact metadata APIs with strict ownership and no arbitrary remote URL fetching.

## P1 — Experience integration
- Project, milestone, decision and experiment views in the canonical dashboard.
- Timeline and status transitions; all edits remain attributable and reversible where possible.
- Context Inspector links from included memories and projects to their source records.

## P1 — Cost and agent operations
- Dated provider/model pricing registry; exact usage-based cost accounting only when a matching rate is known.
- Agent cancellation, per-request deadlines, retry/resume diagnostics and retention policy.
- Do not log prompts, personal context, credentials or embeddings.

## P1 — Continuity and sync
- Account export/import compatibility matrix and dry-run preview.
- Local outbox delivery only after explicit opt-in and an authenticated server sync protocol exist.
- Idempotent operation IDs, per-record version checks, conflict review and recoverable backups.

## P0 — Release validation
- Install from a lockfile with `npm ci`.
- Prisma validate/generate; apply all migrations to disposable PostgreSQL + pgvector.
- Typecheck, unit/contract tests, Next.js production build, API integration tests.
- iOS Safari PWA checks: IndexedDB restore, quota errors, offline boot, outbox opt-in/out, import safety backup and clear-data behavior.

## Boundaries
Proceed with reversible local implementation. Stop before external data transfer, paid spend, production deployment, deletion of user data or permission expansion.
