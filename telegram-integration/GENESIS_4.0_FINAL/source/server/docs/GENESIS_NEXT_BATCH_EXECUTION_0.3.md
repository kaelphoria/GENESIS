# GENESIS 3.0 — Next Execution Batch 0.3

## Priority sequence (continue without asking for routine approval)

1. **Memory Governance**: add explicit memory consent/visibility states and audit transitions; separate stored-by-user from approved-for-context.
2. **Context selection**: enforce `memory.read` capability at the query boundary; include only explicitly permitted records; add exclusions and per-request context manifest visibility.
3. **Conversation reliability**: persist user message before provider call with request idempotency; define failed/pending assistant turn behavior and prevent duplicate submissions.
4. **Provider resilience**: typed provider errors, bounded timeouts, retry policy only for safe transient errors, request/cost telemetry without logging prompts or secrets.
5. **Agent orchestration foundation**: sequential specialist contract with schema-validated output, strict budget and no external actions; critique stage is optional and bounded.
6. **Operational security**: proxy trust validation, rate-limit bucket cleanup job, request body size limits, security headers, audit retention.
7. **Continuity**: versioned export envelope and import preview/validation; preserve existing data until import receipt is confirmed.
8. **iPhone client**: IndexedDB storage adapter and transactional outbox design, preserving local-only mode and explicit sync opt-in.

## Release gates
- `npm ci` from a committed lockfile.
- `npm run check`.
- `npx prisma validate` and `npx prisma migrate deploy` against disposable PostgreSQL + pgvector.
- `npm run build`.
- API integration tests for rate limits, auth, CSRF, tenant isolation, conversation isolation, context grants, export/import.
- iPhone Safari PWA smoke test and service-worker cache isolation.
- Restore test from backup before production release.

## Operating rule
Continue through independent, low-risk work without asking for routine confirmation. Pause only for a decision that is irreversible, exposes data externally, spends money, changes production, or requires explicit user consent. Keep all actions local to the working branch until release gates pass.
