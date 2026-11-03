# GENESIS 3.0 — Core Intelligence Foundation 0.4

## Delivered in this checkpoint

### Intent Engine (deterministic first pass)
- Classifies requests into decision, planning, creation, research, execution, reflection, or conversation.
- Supports Russian and English phrase patterns.
- Emits a deliberately modest confidence score and clarification hint.
- Classification is routing metadata, not a substitute for model reasoning or user clarification.
- Integrated into the ORACLE chat system context.

### Capability Registry
- Central catalogue of capability IDs, domains, statuses, permissions, and risk levels.
- Distinguishes available, planned, and not-connected capabilities.
- Fails closed for unknown capabilities.
- Personal memory reading is enabled only when the user explicitly includes personal context in the request.
- ORACLE receives current capability boundaries and must not claim planned/unavailable actions were completed.

### Durable API rate limiting
- PostgreSQL-backed atomic fixed-window counters shared across app instances.
- HMAC-SHA256 identifiers; raw IP addresses are not persisted.
- Login: 10 attempts / 15 minutes per client network identifier.
- Owner bootstrap registration: 3 attempts / hour per client network identifier.
- ORACLE: 30 requests / minute per authenticated user.
- Returns HTTP 429 with Retry-After; fails closed with HTTP 503 if rate-limit storage or secret configuration is unavailable.
- Migration: `202611030002_durable_rate_limits`.

## Deployment requirements
- Apply Prisma migrations before deploying this version.
- `AUTH_SECRET` must be at least 32 characters; it also keys HMAC rate-limit digests.
- The reverse proxy must overwrite `X-Real-IP` / `X-Forwarded-For`; do not expose the application directly to untrusted clients. If Cloudflare is used, `CF-Connecting-IP` may be used only when requests are guaranteed to arrive through Cloudflare.
- Configure `GENESIS_APP_ORIGIN` to the canonical public origin.
- Configure `GENESIS_BOOTSTRAP_TOKEN` only during initial owner setup, then remove/rotate it according to the deployment runbook.
- Periodically purge stale rate-limit buckets (older than 7 days):

```sql
DELETE FROM "RateLimitBucket" WHERE "updatedAt" < NOW() - INTERVAL '7 days';
```

## Verification
- Node test suite: 18/18 passed.
- Tests cover intent classification, capability fail-closed rules, migration contract, rate-limit SQL contract, origin policy, and service-worker privacy boundaries.
- TypeScript/build/Prisma validation remains blocked because `node_modules` and a configured PostgreSQL service are not present in this environment. A globally installed `tsc` was invoked but cannot provide a valid project check without Next.js, Prisma, React, Node type packages, and the rest of declared dependencies.

## Explicit non-goals in 0.4
- No autonomous tool execution.
- No claims that web research, project mutation, device sync, or memory writes are available.
- No agent swarm until capability permissions, budgets, and audit are enforced end-to-end.

### Memory Governance (added in 0.5 continuation)
- Added per-record `contextPermission` with `denied` as the database default.
- Existing memories migrate to private-by-default; no implicit consent is inferred from prior storage.
- ORACLE recent-memory and vector retrieval both filter to `contextPermission = granted`.
- Memory UI exposes an explicit grant/revoke control for each record.
- Permission changes are recorded in the audit log.
- Migration: `202611030003_memory_context_governance`.
- The per-request Personal Model/world context switch now defaults to off for new client sessions; the user explicitly enables it when desired.
- The chat response returns the exact bounded context manifest, and ORACLE UI exposes a Context Inspector for that response.
