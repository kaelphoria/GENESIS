# GENESIS 3.0 — Continuity & Execution Foundation 0.8

## Status

**INTEGRATED / CONTRACT-TESTED.** Runtime integration, Prisma generation, database migration application, and iOS Safari E2E remain unverified in the current environment.

## Provider and ORACLE reliability

- Memory embedding generation now uses the same server-only provider boundary as ORACLE chat; no direct OpenAI SDK calls remain in the memory service.
- Embedding failures preserve typed, sanitized provider error codes and never log prompts or vectors.
- ORACLE completion accepts the incoming request AbortSignal and maps cancelled provider calls to a typed `CANCELLED` error.
- Each specialist trace records provider/model and actual input/output token counts. Monetary cost is explicitly `null` until a versioned price registry is configured; GENESIS does not invent cost estimates.
- Account export declares `format=genesis.account-export` and `schemaVersion=1`, and includes project/decision continuity records.

## iPhone local-first continuity

- Added an IndexedDB durability layer alongside the existing localStorage compatibility path.
- Saves are mirrored to an IndexedDB snapshot. If localStorage is empty, the application attempts to restore the latest IndexedDB snapshot.
- Optional local outbox uses one IndexedDB read-write transaction for the snapshot and queued operation; entries carry unique operation IDs and are bounded to 50.
- Sync consent is explicitly off by default. Enabling it only prepares a local queue; no remote endpoint or background transmission exists in this release.
- Disabling consent clears queued personal snapshots. Clearing local data clears both stores.
- Local backup format is versioned. Import validates format/schema and data shape, previews record counts, and downloads a safety copy of current local data before replacement.
- Service worker caches `storage.js` as a static shell asset and continues to bypass APIs/private requests.

## Execution and decision domain

Added additive Prisma models and migration `202611030006_execution_domain`:

- Project: outcome-oriented work container.
- Milestone: ordered project checkpoints.
- Action: optional project association; existing actions remain intact.
- Decision: question, options, selected outcome, rationale, assumptions and status.
- Experiment: hypothesis, method, result and lifecycle linked to a decision.
- Artifact: versioned metadata and storage pointer linked to a project.

Authenticated, ownership-scoped APIs are available for projects, milestones, decisions and experiments. Mutations require same-origin validation and are audited for core project/decision records. Account export includes these records.

## Verification

- Node test suite: 63 passed, 0 failed in the final contract suite.
- `node --check` passes for the IndexedDB adapter, service worker and extracted iPhone inline script.
- `git diff --check` passes.
- Not verified: Prisma schema validation/client generation, PostgreSQL migration application, Next.js build, API integration against a real database, iOS Safari E2E, and real IndexedDB behavior on device.

## Next autonomous batch

1. Complete artifact/source provenance APIs and link memory records to source records.
2. Add project/decision/milestone UI in the canonical Next.js dashboard.
3. Add a migration and conflict-aware import preview for account exports; never auto-merge consequential records.
4. Add a provider pricing registry with dated per-model rates and persist cost estimates only when exact rates are configured.
5. Add operational retention/cleanup jobs and observability for request lifecycle, rate-limit buckets, embeddings and agent traces.
6. Build the disposable PostgreSQL integration harness and run full Prisma/build/browser release gates when dependencies/runtime are available.
7. Connect the local outbox to server sync only after explicit user opt-in, authenticated ownership checks, idempotent operation processing and conflict review are implemented end-to-end.

## Safety boundaries

No production deployment, paid service, external sharing, account connection, or irreversible user-data operation was performed. Local outbox does not transmit data.
