# GENESIS 3.0 — Security & Release Gate 0.2

Date: 2026-11-03
Status: implementation checkpoint; not a production security certification.

## Implemented in this checkpoint

- First-owner bootstrap requires a server-only token of at least 32 characters.
- A PostgreSQL transaction-scoped advisory lock serializes simultaneous owner bootstrap attempts.
- Every mutating `/api` route now applies the same-origin guard before processing the request.
- `GENESIS_APP_ORIGIN` provides the canonical origin when deployed behind a reverse proxy; the request URL origin is the development fallback.
- Missing, malformed, `null`, or cross-origin `Origin`/`Referer` values are rejected with 403 and `Cache-Control: no-store`.
- PWA service worker caches only the known public app shell, skips API/dynamic/authenticated/cross-origin requests, and deletes only caches under its own prefix.
- Conversation history is isolated by conversation ID; legacy messages are retained by the additive migration.
- Memory embedding lifecycle metadata and stale-vector invalidation are implemented.

## Security controls still required before production

### Durable rate limiting

Implement a PostgreSQL-backed, atomic fixed-window or token-bucket limiter. It must work across multiple application instances; process-local counters are not acceptable. Suggested initial policy (tune after observing real usage):

| Surface | Key | Initial threshold | Response |
|---|---|---:|---|
| Login | trusted client IP + normalized account identifier | 8 / 10 min | 429 + Retry-After |
| Owner bootstrap | trusted client IP | 5 / hour | 429 + Retry-After |
| ORACLE chat | user ID | 20 / minute and daily token budget | 429 / 402-style budget response |
| Embeddings | user ID | included in chat + memory budget | do not silently spend unboundedly |

Requirements:
- Use an atomic SQL upsert/transaction; never read-then-write a counter.
- Hash identifiers before persistence; do not store raw IP addresses unless a documented retention need exists.
- Expire old buckets and add bounded cleanup.
- Treat `X-Forwarded-For` and `X-Real-IP` as trusted only when a configured reverse proxy strips client-supplied values. Document the trust boundary; do not trust arbitrary forwarded headers by default.
- Include deterministic tests for window rollover, concurrent increments, expiry, and per-user isolation.

### Other release blockers

- Add integration tests against disposable PostgreSQL + pgvector for bootstrap concurrency, conversation ownership, migration backfill, and embedding update/failure races.
- Verify that all private API responses use `Cache-Control: no-store`; audit GET handlers as well as mutations.
- Add CSRF/origin tests at HTTP integration level, including reverse-proxy canonical-origin behavior.
- Add authentication/session tests: expiry, invalid signature, logout, secure cookie in production, and secret rotation policy.
- Review request size limits and content-type validation on JSON endpoints.
- Add a security audit for IDOR and tenant scoping on every query.
- Add dependency lockfile and vulnerability scan after registry access returns.

## Deployment configuration

- `AUTH_SECRET`: unique random secret, 32+ characters; never commit.
- `GENESIS_BOOTSTRAP_TOKEN`: one-time owner bootstrap token, 32+ characters; remove after owner creation.
- `GENESIS_APP_ORIGIN`: canonical origin, e.g. `https://genesis.example` (scheme + host, no path).
- `DATABASE_URL`: private PostgreSQL connection with pgvector enabled.
- `OPENAI_API_KEY`: server-side only; never expose to browser/PWA.
- Reverse proxy must set a canonical host and strip untrusted forwarded headers.

## Release gate

A release is **VERIFIED** only after all of the following pass in a clean environment:

1. `npm ci` using a committed lockfile.
2. `npx prisma validate` and `npm run db:generate`.
3. `npm run typecheck`, `npm test`, and `npm run build`.
4. Disposable PostgreSQL migration and integration suite.
5. Browser E2E for login, logout, owner bootstrap, chat isolation, memory lifecycle, export, delete, offline PWA and update lifecycle.
6. Backup/restore drill and export round-trip.
7. Security review of deployment proxy, cookies, secrets, CORS, CSP, rate limits and data retention.

Do not describe the current checkpoint as production-ready.
