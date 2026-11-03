# GENESIS 3.0 — Next Execution Batch 0.4

## Autonomous work queue

### P0 — Memory governance completion
- Add Context Inspector showing which profile/world/memory entries were included in a specific request.
- Add a global per-request context switch defaulting to off on new sessions; preserve per-memory grants.
- Ensure revoke is effective immediately for new requests and audit all grants/revokes.
- Add export metadata describing permissions without exporting secrets.

### P1 — Conversation reliability
- Add request idempotency keys with a unique constraint scoped to user/conversation.
- Persist user turns before provider execution and model pending/failed/completed states.
- Prevent duplicate messages on client retry; never silently duplicate provider charges.

### P1 — Provider resilience
- Move embeddings behind a provider boundary.
- Add request timeout, typed errors, bounded transient retry, provider/model metadata, and cost accounting.
- Do not log prompts, personal context, API keys, or raw embeddings.

### P1 — Agent orchestration
- Define specialist input/output schemas and capability allowlists.
- Start with sequential in-process orchestration; no autonomous external actions.
- Add budget ceilings, cancellation, trace IDs, and human approval for high-impact operations.

### P2 — Continuity and client
- Versioned export/import with preview, validation, backup, and receipt.
- IndexedDB adapter + outbox with idempotent operation IDs and explicit sync opt-in.
- Conflict review for profile, memory, decisions, and other consequential records.

## Release gate
- Lockfile + clean `npm ci`.
- Typecheck, all tests, Prisma validation, clean build.
- Apply all migrations to disposable PostgreSQL + pgvector.
- Integration tests for ownership isolation, context grants/revocation, request idempotency, rate limiting, export/import.
- iOS Safari PWA tests, offline mode, backup/restore.

## Approval boundaries
Proceed autonomously on local reversible work. Stop before external sharing, paid API spend beyond configured budget, production deployment, deletion, or changes requiring the user's explicit consent.
