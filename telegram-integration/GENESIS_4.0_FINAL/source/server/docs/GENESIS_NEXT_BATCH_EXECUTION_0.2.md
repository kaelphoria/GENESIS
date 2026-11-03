# GENESIS 3.0 — Next Batch Execution Plan 0.2

This file is the executable handoff for the next environment with package registry, database and browser tooling.

## Batch A — Restore reproducible build

1. Enter `server/`; confirm Node 22 LTS.
2. Run `npm install` once to create `package-lock.json`; review and commit exact resolved versions.
3. Run `npm ci` from a clean checkout.
4. Run Prisma validate/generate, typecheck, tests and production build.
5. Resolve all errors before changing domain scope.

## Batch B — Database verification

1. Start disposable PostgreSQL with pgvector.
2. Apply migrations from an empty database.
3. Restore a fixture matching the legacy schema and containing users with/without chat messages.
4. Apply the new migration and verify every legacy message is preserved and assigned to exactly one owner conversation.
5. Race two owner bootstrap requests; assert exactly one account is created.
6. Verify cross-user conversation reads and message writes are rejected.
7. Change memory content during an embedding request; assert stale embeddings never become active.
8. Test missing AI key and embedding provider failure paths.

## Batch C — Security

1. Add durable PostgreSQL-backed rate limiting per `GENESIS_SECURITY_AND_RELEASE_GATE_0.2.md`.
2. Add HTTP-level origin/CSRF tests with `GENESIS_APP_ORIGIN` behind a proxy.
3. Test auth cookies, session expiry and all tenant-scoped operations.
4. Add payload size/content-type checks and security headers/CSP.
5. Verify no private API response can enter the service-worker cache.

## Batch D — Local-first continuity

1. Introduce an IndexedDB repository abstraction while retaining a versioned migration from current localStorage data.
2. Import flow: validate -> preview -> create backup -> apply -> verify receipt; never silently overwrite source data.
3. Add durable outbox records with stable `operationId`, entity version, retry count and status.
4. Add server idempotency receipts and cursor-based sync.
5. Implement conflict policy by record type; no silent last-write-wins for profile, memory, decisions or artifacts.
6. Add export/import round-trip and offline/online browser tests.

## Batch E — Intelligence contracts

Implement the following as typed, versioned contracts before adding specialist agents:

- `IntentEnvelope`: intent, entities, requested outcome, constraints, sensitivity, confidence, clarification requirement.
- `ContextManifest`: selected source IDs, provenance, time validity, trust state, permission grant, token budget, omission reasons.
- `CapabilityDescriptor`: input/output schema, permission scopes, risk class, cost estimate, timeout, idempotency support, version and tests.
- `AgentTask`: goal, bounded context, allowed capabilities, budget, deadline, expected output schema and review requirement.
- `DecisionRecord`: options, assumptions, evidence, uncertainty, user choice, timestamp and review date.

Every generated conclusion must distinguish user-stated fact, imported source, system observation, inference and hypothesis. Never silently promote inference to durable memory.

## Batch F — Integration and handoff

- Run complete acceptance matrix.
- Produce migration report, test report, SBOM/dependency report, backup, rollback instructions and clean source archive.
- Mark each feature WORKING / INTEGRATED / VERIFIED separately.
