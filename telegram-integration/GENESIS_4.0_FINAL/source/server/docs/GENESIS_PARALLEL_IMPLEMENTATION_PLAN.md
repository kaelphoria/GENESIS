# GENESIS PARALLEL IMPLEMENTATION PLAN

## Workstream model
Parallel development is organized around stable contracts and integration gates. Each stream owns a bounded area; shared schema and API contracts are reviewed centrally.

| Stream | Scope | First deliverables |
|---|---|---|
| A — Core & Security | Auth, authorization, DB, rate limits, audit | Secure bootstrap, origin policy, rate limiting, CI |
| B — Intelligence | ORACLE, context, provider routing, evaluation | Conversation isolation, context manifest, provider adapter |
| C — Knowledge | Memory, provenance, temporal model | Embedding lifecycle, epistemic status, versioning |
| D — Personal Model | Nine Worlds, goals, assessments | WorldContext, WorldAssessment, Personal Model revisions |
| E — Execution | Projects, milestones, workflows | Project and milestone vertical slice |
| F — Experience | Universe, responsive UI, accessibility | Shared design tokens, navigation, conversation UI |
| G — Local & Sync | PWA, IndexedDB, outbox, conflict resolution | Safe service worker, storage abstraction, backup preview |
| H — Evolution & Ops | Monitoring, eval, sandbox, releases | Health diagnostics, error taxonomy, release workflow |

## Integration rules
1. Schema changes require migration SQL, data backfill plan and export compatibility.
2. API changes require input/output schemas and ownership tests.
3. UI changes must call real APIs and expose loading, empty, error and success states.
4. AI features require a context manifest, cost ceiling, timeout and evaluation cases.
5. External actions require explicit scopes, confirmation and audit events.
6. PWA sync must be idempotent and preserve local-only data.
7. Every release candidate must pass typecheck, tests, build, migration checks and restore checks where applicable.

## Current implementation tranche

### Implemented in this working branch
- Protected implementation copy and baseline commit.
- Service worker restricted to the application shell; API/dynamic/cross-origin/authenticated requests bypass caching.
- Service worker deletes only prior caches with the GENESIS cache prefix.
- One-time owner bootstrap token and PostgreSQL advisory lock for concurrent first-user creation.
- Conversation model and additive migration; legacy messages backfilled into one imported conversation per user.
- Conversation list/create/read API and ORACLE conversation selection.
- Memory embedding lifecycle metadata and content-hash guarded refresh; stale vectors are removed on failure.
- Export includes conversations.
- Node built-in service-worker policy tests.

### Not yet verified
- Prisma schema validation and generated client.
- TypeScript typecheck and Next.js production build.
- Migration execution against PostgreSQL/pgvector.
- Browser/Safari/iOS PWA behavior.
- End-to-end login, conversation, memory and export flows.

### Immediate next gates
1. Restore package installation and generate/commit package-lock.
2. Run Prisma format/validate/generate and typecheck.
3. Run migration on disposable PostgreSQL with pgvector; test legacy data backfill.
4. Add integration tests for owner bootstrap concurrency and conversation ownership.
5. Add durable rate limiting and origin/CSRF policy.
6. Implement PWA IndexedDB abstraction and safe import preview/restore.
7. Add CI and release artifact generation.
