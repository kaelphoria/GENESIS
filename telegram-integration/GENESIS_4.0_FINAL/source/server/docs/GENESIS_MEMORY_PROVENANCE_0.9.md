# GENESIS 3.0 — Memory Provenance Foundation 0.9

## Status

**INTEGRATED / CONTRACT-TESTED.** Runtime/database validation and browser E2E remain release-gate items.

## Knowledge provenance

- Added `Source`, `MemoryVersion` and `ProvenanceEvent` models with user ownership, indexes and explicit deletion behavior.
- `MemoryRecord` now links optionally to a source and carries an integer version.
- Source registry records kind, title, optional HTTP(S) URI, optional SHA-256 content hash and a trust status.
- Every newly registered source is marked `unverified`. GENESIS does not fetch or claim to verify a source automatically.
- Memory creation writes version 1 and a provenance event in one database transaction.
- Memory updates use compare-and-set version checks, increment the version and write a snapshot plus provenance event in the same transaction.
- Context permission grants/revokes are represented in the provenance timeline and existing audit log.
- Memory detail API exposes a bounded recent history of versions and provenance events to the authenticated owner.
- Account export includes sources, memory versions and provenance events.

## Experience

- Memory workspace supports registering sources, attaching a source to a new memory record, viewing trust status and opening version/provenance history.
- Memory permission changes now send the observed version, reducing accidental overwrite from stale UI state.

## Migration

Additive migration: `202611030007_memory_provenance`.
Existing memories retain their content, receive version 1 by default, and remain without a source reference until the user links one. No backfilled source is invented.

## Verification

- Node contract suite: **72 passed, 0 failed**.
- `git diff --check` passed.
- Prisma generation/validation, PostgreSQL migration application, Next.js production build, database-backed concurrency tests and browser E2E remain unverified due to the current runtime lacking installed project dependencies and configured PostgreSQL.

## Next autonomous batch

1. Canonical dashboard UI for projects, milestones, decisions and experiments.
2. Artifact metadata API and source/artifact provenance linking.
3. Explicit conflict-aware account import preview and version compatibility.
4. Dated model pricing registry and exact usage cost ledger.
5. Retention and cleanup policies for audit, request traces, memory versions and rate-limit buckets.
6. Disposable PostgreSQL + pgvector release gate and iPhone Safari E2E when runtime is available.

## Safety

No remote source URLs are fetched. Source trust labels are not inferred. No external transfer or production deployment was performed.
