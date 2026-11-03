# GENESIS 3.0 — Artifact, Import & Cost Foundation 0.11

## Status

**INTEGRATED / CONTRACT-TESTED.** No file bytes are uploaded or remotely stored in this checkpoint. Full database/runtime validation remains a release-gate item.

## Artifact lifecycle

- Added `Artifact.sourceId` and lifecycle `status` with additive migration `202611030008_artifact_lifecycle`.
- Added authenticated artifact metadata GET/POST/PATCH API.
- Artifacts can link to an owned project and/or source; every link is checked against the current user.
- Registration and updates create provenance events and audit records; archive is a lifecycle state, not a hard delete.
- File upload, storage URI, and content hash are intentionally not enabled. Registration explicitly records `contentBytesStored=false`; no client hash is treated as verified.

## Account import preview

- Added authenticated, same-origin `POST /api/import/preview`.
- The endpoint accepts at most 10 MiB and validates the versioned `genesis.account-export` format.
- Supports declared schema versions 1–3 and rejects unknown future versions.
- Produces record counts, duplicate-ID errors, malformed collection errors, dangling-reference errors and compatibility warnings.
- The endpoint is read-only: `mutationPerformed=false`. It does not write to the database or replace/merge account records.
- Account export schema is now version 3.

## Provider cost ledger

- Added a dated, model-specific pricing registry configured through `GENESIS_MODEL_PRICING_JSON`.
- No prices are hardcoded. Empty, stale or unmatched catalog entries leave cost unknown.
- Exact cost is calculated only when provider/model/effective date match and all token classes are priced.
- Captures cached input tokens separately; if cached-input pricing is missing, cost remains unknown rather than being overstated.
- Per-agent token usage remains available even when cost is unknown.

## Verification

- Node contract suite: **92 passed, 0 failed** (final count to be re-run before checkpoint packaging).
- `git diff --check` passed.
- Runtime validation remains blocked by absent installed dependencies and PostgreSQL service.

## Next autonomous batch

1. Add artifact detail/history UI and secure file-storage adapter design; only enable uploads after access, size, content-type, hashing and retention controls are complete.
2. Implement explicit account import apply with dry-run receipt, verified backup, idempotency and conflict review; do not silently merge consequential records.
3. Add retention and cleanup policies for request records, rate-limit buckets, audit events, memory versions and provenance events.
4. Add operational diagnostics and integration tests on disposable PostgreSQL + pgvector.
5. Complete release gate: lockfile, `npm ci`, Prisma validate/generate, migrations, typecheck, production build, API integration and iOS Safari E2E.
