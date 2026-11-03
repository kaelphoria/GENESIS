# GENESIS 3.0 — Next Autonomous Batch 0.6

## P0 — Execution experience
- Add dashboard views for Projects, Milestones, Decisions and Experiments.
- Support explicit project-action links, milestone status, decision options/rationale, experiment hypothesis/results.
- Keep all list/detail queries user-scoped; all mutations same-origin, validated, audited and conflict-aware.

## P1 — Artifact and source provenance
- Artifact metadata CRUD with storage-provider abstraction; no arbitrary URL fetching or implicit public access.
- Connect artifacts and memory records to Source and ProvenanceEvent.
- Content hash computation must happen on trusted server-side bytes, not accept client claims as verified.

## P1 — Portability
- Account import dry-run, schema migration, validation report and conflict preview.
- No silent replacement/merge of consequential records.
- Verify source IDs and provenance relations on import; keep original provenance labels intact.

## P1 — Cost and operations
- Versioned, dated provider pricing catalog.
- Persist exact cost only when provider, model, rate date and token classes match; otherwise preserve token counts and mark cost unknown.
- Cleanup policy for old request records, rate buckets, audit events and memory versions.
- Request/agent observability without prompts, personal context, credentials or embeddings.

## P0 — Release gate
- `npm ci` from lockfile, Prisma validate/generate, migrations on disposable PostgreSQL + pgvector.
- Typecheck, unit/contract suite, Next production build, API integration and browser E2E.
- iOS Safari IndexedDB recovery, offline, outbox opt-in/out, backup and clear-data tests.

## Approval boundaries
Continue reversible local work. Pause for external transfer, paid spend, production deployment, irreversible deletion or permission expansion.
