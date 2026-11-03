# GENESIS 3.0 — Execution & Decision Experience 0.10

## Status

**INTEGRATED / CONTRACT-TESTED.** UI and API source are integrated. Full production compilation and browser/database runtime remain unverified because dependencies and PostgreSQL are unavailable in the current environment.

## Canonical dashboard

- Added Projects and Decision Lab navigation and responsive workspaces.
- Projects view lists owned projects, creates projects, creates milestones and changes milestone lifecycle status.
- Project view displays progress, linked action/decision/artifact counts and milestone completion.
- Decision Lab creates questions with options and rationale, optionally links to an owned project, records the selected option and changes decision status.
- Experiments can be created against a decision and progressed through planned/running/completed/abandoned.
- Every action uses the authenticated same-origin API and server-side ownership checks; UI state is refreshed from canonical server records.

## Memory provenance experience

- Memory workspace can register a source and attach it to a memory record.
- Sources are explicitly labelled `UNVERIFIED`; URLs are metadata only and are never fetched automatically.
- Memory cards show source trust status and current version.
- Owner can inspect up to 30 recent version snapshots and provenance events.
- Existing memory rows are backfilled as version-one snapshots by migration, with a `LEGACY_MEMORY_BASELINE` provenance event. No source is invented for historical records.
- Memory edits use compare-and-set version checks to avoid silent overwrites.

## Verification

- Node contract suite: **76 passed, 0 failed**.
- `git diff --check` passed.
- Runtime verification still required: Prisma validate/generate, PostgreSQL migrations 006/007, API integration, Next.js production build and browser E2E.

## Next autonomous batch

1. Artifact metadata APIs, provenance links and content-hash computation from trusted server bytes.
2. Account import dry-run, schema migration, conflict report and explicit replacement/merge approval.
3. Dated model pricing registry and exact cost ledger.
4. Retention/cleanup and observability.
5. Full integration release gates when dependencies and database are available.
