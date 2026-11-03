# GENESIS — Chat Reliability 0.6

## Scope

This checkpoint hardens the ORACLE request lifecycle without changing the modular-monolith architecture or granting the system any external action authority.

## Request lifecycle

- Every chat send carries a client-generated request ID. The server scopes the idempotency key to the authenticated user and stores a SHA-256 hash of the normalized prompt.
- A key cannot be reused for a different prompt or conversation.
- The request record and user message are committed atomically before AI completion begins. Retry claims use a compare-and-set update to prevent two workers from reclaiming the same failed/stale request.
- A completed duplicate returns the stored answer and context manifest; it does not call the model again.
- A concurrent pending duplicate returns HTTP 409 with a short retry hint.
- Failed requests can be retried with the same key. Stale pending requests can be reclaimed after five minutes.
- The Dashboard retains the key for a failed send of the same prompt, preventing accidental duplicate user messages and duplicate model calls after a response is lost.

## Provider boundary

- Provider failures are normalized into typed error categories.
- Completion calls have a 45-second timeout; embedding calls have a 20-second timeout. Both disable hidden SDK retries and perform at most one retry for transient network, timeout, rate-limit, or server-side failures.
- Error messages exposed to the route do not include raw upstream response bodies.
- Provider and model metadata plus token usage are returned by the adapter for future cost/observability integration; this checkpoint does not yet persist billing metrics.

## Data model

`ChatRequest` is a durable request ledger linked to the authenticated user and conversation. The idempotency key is unique per user. The migration is additive and does not rewrite existing chat messages.

## Verification

- Node test suite: 32 passed, 0 failed.
- `git diff --check`: passed.
- Prisma generation/schema validation, PostgreSQL migration application, Next.js production build, and browser E2E remain unverified because this working environment has no `node_modules` or configured PostgreSQL service.

## Known next work

1. Make request+user-message creation a single DB transaction and add concurrency integration tests against PostgreSQL.
2. Add durable request cleanup/retention policy and persist token/cost telemetry.
3. Add end-to-end tests for lost responses, concurrent duplicate sends, and failed retry recovery.


## Specialist orchestration foundation 0.7 (working)

- Deterministic specialist routes select one or two bounded agents according to the classified intent.
- Decision, planning and execution-planning use an analyst/planner followed by a critic or safety reviewer. Creation, research synthesis, reflection and ordinary conversation use one specialist.
- Every specialist receives only enabled capability IDs. No specialist has external execution tools; research instructions explicitly prohibit claims of web search.
- Per-agent output is validated and intermediate specialist output is checkpointed in the durable request record. Failed multi-stage requests resume from the last successfully persisted stage rather than rerunning already completed agents.
- The UI exposes the trace ID, specialist sequence and output-token budget.
- The orchestration migration is additive (`202611030005_agent_trace`) so previously applied migrations remain immutable.
