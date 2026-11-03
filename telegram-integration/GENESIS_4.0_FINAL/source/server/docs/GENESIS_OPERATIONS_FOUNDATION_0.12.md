# GENESIS 3.0 — Operations Foundation 0.12

## Status

**INTEGRATED / CONTRACT-TESTED.** Maintenance script and authenticated diagnostics are implemented. No cleanup was executed and no user records were deleted.

## Diagnostics

- Added authenticated `GET /api/health/details`.
- Reports aggregate pending/failed embedding counts, stale pending requests, failed requests over 24 hours, AI provider configured flag and pricing catalog configured flag.
- Returns no prompt, message, memory content, credential, embedding vector or provider secret.
- Public `/api/health` remains a minimal service readiness endpoint.

## Operational cleanup

- Added `scripts/cleanup-rate-limits.mjs` and `npm run maintenance:rate-limits`.
- Dry-run is the default; it reports eligible expired rate-limit buckets and cutoff.
- Apply requires both `--apply` and `GENESIS_MAINTENANCE_CONFIRM=DELETE_EXPIRED_RATE_LIMIT_BUCKETS`.
- Retention is clamped to at least seven days, with invalid environment values falling back safely to seven days.
- Script only deletes `RateLimitBucket` rows. It does not touch messages, memories, projects, audit events, memory versions or provenance history.
- No cleanup command was executed in this session.

## Retention policy boundary

Chat requests, audit events, memory versions and provenance events remain unbounded until a user-visible retention policy and export/deletion guarantees are defined. No automatic user-content deletion has been introduced.

## Verification

- Node contract suite: **95 passed, 0 failed**.
- `git diff --check` passed.
- Prisma validation, PostgreSQL integration, Next production build and browser/device E2E remain unverified due to missing installed dependencies and database service.

## Next autonomous batch

1. Implement explicit account import apply with a preview receipt bound to user and payload hash, verified backup, idempotency and conflict review.
2. Add artifact detail/history UI and storage adapter only after secure upload/access controls are complete.
3. Define user-visible retention controls and deletion/export guarantees before deleting request/audit/memory history.
4. Build PostgreSQL + pgvector integration harness and install reproducible dependencies from a lockfile.
5. Run full production build, API integration and iOS Safari release gates when runtime resources are available.
