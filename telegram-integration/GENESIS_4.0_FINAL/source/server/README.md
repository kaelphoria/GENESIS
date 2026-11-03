# GENESIS 1.0 — Private Intelligence System

A private, single-user-first personal intelligence application. Product principle: **AI expands. Human decides. Human remains the author.**

## Implemented in this source package

- Next.js App Router + TypeScript application.
- Private email/password registration and login; password hashes use bcrypt.
- Signed, HttpOnly, SameSite session cookie (7-day lifetime).
- PostgreSQL data model with per-user ownership and cascading deletion.
- Nine Worlds, intentions, actions, priorities, due dates and completion.
- User-entered memory with epistemic classification and provenance fields.
- Personal Model with editable fields and version snapshots.
- ORACLE API using OpenAI server-side, authorized profile/world/memory context, conversation history and optional pgvector retrieval.
- JSON data export and account/data deletion.
- Audit events for account creation, login, profile updates, memory creation and export.
- Responsive cinematic dark UI.

## Deliberately not claimed as complete

Voice capture/TTS, external connectors, multi-agent orchestration, proactive/background agents, advanced simulations, managed backups, MFA, production rate limiting, observability, incident response, and a fully hardened production security review are not included as operational features in this package. They must not be advertised as live until implemented and tested.

## Requirements

- Node.js 20.9+
- PostgreSQL 15+ with the `vector` extension available (pgvector)
- OpenAI API key for ORACLE and semantic memory embeddings

## Local setup

1. Copy `.env.example` to `.env` and fill `DATABASE_URL`, `AUTH_SECRET`, `GENESIS_BOOTSTRAP_TOKEN`, and `OPENAI_API_KEY`. Generate the bootstrap token separately with `openssl rand -hex 32`.
2. Generate a secret, for example: `openssl rand -base64 48`.
3. Install dependencies: `npm install`.
4. Generate Prisma client: `npm run db:generate`.
5. Apply migrations: `npm run db:migrate`.
6. Start locally: `npm run dev`.
7. Open `http://localhost:3000`, choose account creation, and enter the bootstrap token from your private `.env` file. Never publish or commit this token.

`OPENAI_API_KEY` is read only by server routes. Never add it to a `NEXT_PUBLIC_*` variable, commit it, or paste it into chat.

## Local container run

1. Copy `.env.example` to `.env`.
2. Set `POSTGRES_PASSWORD`, `AUTH_SECRET`, `GENESIS_BOOTSTRAP_TOKEN`, and optionally `OPENAI_API_KEY` in `.env`.
3. Run `docker compose up --build`.
4. Open `http://localhost:3000` and create the first account.

The bundled PostgreSQL image includes pgvector. The database volume persists across container restarts. This local Compose setup is for development/private evaluation; configure encrypted backups and TLS before remote use.

## Private cloud deployment

Recommended path: managed PostgreSQL with pgvector + private application deployment on a platform that supports Next.js server runtime and environment secrets. Domain can be connected later.

1. Create a private repository and push this project.
2. Provision PostgreSQL and enable pgvector. Confirm the database role may create/use the extension or ask the provider to enable it.
3. Create the app service from the repository.
4. Set `DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `OPENAI_MODEL`, and `APP_URL` in the provider's encrypted environment-variable settings.
5. Set build command `npm run build`; start command `npm run start`.
6. Run `npm run db:generate` during build and `npm run db:migrate` as a one-off release command before routing traffic.
7. Registration is disabled unless a separate `GENESIS_BOOTSTRAP_TOKEN` of at least 32 characters is configured. The first-owner creation is serialized with a PostgreSQL advisory lock; after the first account exists, further registration is rejected. Remove the bootstrap token from the deployment environment after the owner account is created.
8. Configure managed backups/PITR, restore tests, monitoring, request limits, and MFA before treating this as production-grade.

## Data and privacy model

- User-owned rows carry `userId`; APIs scope reads and mutations to the authenticated user.
- Profile snapshots are versioned before updates.
- Memory records distinguish user statements, self-assessments, observations and hypotheses.
- Model interpretations are not automatically saved as permanent memory.
- The chat endpoint includes only the current user's profile, saved memory records, world intentions and messages from the selected conversation. Legacy chat messages are migrated into an imported conversation.
- Raw audio is not captured by this release.
- Deleting a user cascades through their records.

## Known release limitations / hardening before external use

- Add durable rate limiting for login, registration and AI calls (e.g. managed Redis or provider edge limits).
- Add an audited recovery and owner-transfer workflow before enabling any future account onboarding.
- Add MFA and a tested account recovery flow.
- Configure database encryption at rest, TLS, automated backups, point-in-time recovery and restore drills with the hosting provider.
- Add monitoring, alerting, structured redacted logs, abuse controls and incident procedures.
- Add CSRF/origin policy tests, security headers review and dependency scanning.
- Validate pgvector extension availability and embedding model dimensions on the selected database.
- Add integration/e2e tests against a disposable PostgreSQL instance.
- Add retention controls for chat history and explicit per-category AI context permissions.
- Perform a security review before storing sensitive personal, health or financial data.

## Architecture

`app/` — UI and server API routes  
`components/` — application interface  
`lib/` — auth, database, validation, world seed  
`prisma/` — canonical schema and SQL migration  
`docs/` — architecture, deployment and release gates

## New 3.0 foundation changes

- ORACLE conversations are isolated. Legacy chat messages are preserved in an `Импортированная история` conversation during migration.
- The `/api/conversations` endpoint lists, creates and reads only the authenticated user's conversations.
- Memory embedding status is tracked (`pending`, `processing`, `ready`, `failed`). Content hashes prevent an old embedding job from overwriting a newer memory revision.
- The iPhone service worker caches only the known application shell. It does not cache API or dynamic/private responses and does not delete caches belonging to other applications on the same origin.
- Owner registration requires `GENESIS_BOOTSTRAP_TOKEN` (minimum 32 characters). Generate with `openssl rand -hex 32`; remove the variable after creating the owner account.


### Request-origin protection

Set `GENESIS_APP_ORIGIN` to the canonical public origin (scheme + host, no path), especially when running behind a reverse proxy. All browser mutation endpoints reject missing, malformed, or cross-origin `Origin`/`Referer` headers. Keep TLS termination and trusted proxy host forwarding correctly configured.

## Execution and decision APIs (foundation 0.8)

Authenticated, same-origin mutation endpoints are available for:

- `GET/POST/PATCH/DELETE /api/projects`
- `GET/POST/PATCH/DELETE /api/milestones`
- `GET/POST/PATCH/DELETE /api/decisions`
- `GET/POST/PATCH/DELETE /api/experiments`

Every record is scoped to the authenticated user. Milestones must belong to an owned project; experiments must reference an owned decision; project and decision links are ownership-checked. Account export includes these records. Artifact metadata is modeled and exported; artifact CRUD/storage is intentionally not enabled until storage policy and provenance are implemented.

## Artifact, provenance and import foundations

- `GET/POST/PATCH /api/artifacts` manages private artifact metadata, project/source links and archive status. This release does not upload file bytes or create public storage URLs.
- `GET/POST /api/sources` registers source metadata. Newly registered sources are always `unverified`; the server does not fetch source URLs.
- `GET /api/memories?id=...` returns the owner's version snapshots and provenance events.
- `POST /api/import/preview` validates a versioned account export (maximum 10 MiB), reports counts and relationship errors, and performs no mutation. There is no import-apply endpoint yet.

### Optional model pricing catalog

Set `GENESIS_MODEL_PRICING_JSON` to a JSON array of dated provider/model rates. Each record requires `provider`, `model`, `currency: "USD"`, `effectiveFrom`, `inputUsdPerMillion` and `outputUsdPerMillion`. If cached input tokens can occur, include `cachedInputUsdPerMillion`; otherwise cost remains unknown whenever cached input usage is non-zero. Rates are not bundled or assumed. Missing/stale rates leave monetary cost explicitly unknown while preserving token usage.

## Operations and maintenance

- Authenticated aggregate diagnostics: `GET /api/health/details`. It reports memory-index counts, stale request counts and whether provider/pricing configuration exists; it never returns prompts, memory content, credentials or vectors.
- Rate-limit cleanup: `npm run maintenance:rate-limits` is dry-run by default. Apply only after reviewing the eligible count by passing `--apply` and setting `GENESIS_MAINTENANCE_CONFIRM=DELETE_EXPIRED_RATE_LIMIT_BUCKETS`. Retention cannot be configured below seven days.
- The cleanup script deletes only expired `RateLimitBucket` rows. It does not delete conversations, messages, memories, audit events or user projects.
- Request, audit, memory-version and provenance retention remain intentionally unbounded until a user-visible retention policy and export/deletion guarantees are implemented.
- Project workspace now registers artifact metadata, links a source and shows provenance history. This is metadata-only; no binary file upload/storage is active.
- A valid import preview returns a short-lived HMAC receipt bound to the authenticated user and exact raw payload SHA-256. The receipt is a prerequisite for a future apply endpoint; preview itself remains read-only.

## Optional local AI provider: Ollama

The server-only provider router supports `GENESIS_AI_PROVIDER=ollama` in addition to the default OpenAI adapter. Configure `OLLAMA_BASE_URL` (defaults to `http://127.0.0.1:11434`), `OLLAMA_MODEL`, and `OLLAMA_EMBEDDING_MODEL`. The embedding model must return exactly 1536 dimensions to match the current pgvector column. Plain HTTP is restricted to loopback; remote endpoints require HTTPS. This adapter is optional and is not automatically selected.

## Local MCP bridge (read-only)

`npm run mcp:stdio` starts the local stdio bridge. Set `GENESIS_MCP_OWNER_USER_ID` to the exact owner ID and configure the normal `DATABASE_URL`. The bridge has no network listener and exposes only read-only tools. Memory search returns only active records with explicit `contextPermission=granted`. The bridge has not been connected to a remote ChatGPT app; remote access requires a separate OAuth 2.1 + HTTPS Streamable HTTP implementation.

## Backup encryption helper

The AES-256-GCM backup envelope helper is available at `lib/continuity/backup-envelope.mjs`. It requires `GENESIS_BACKUP_KEY` to be configured by the operator as a base64-encoded 32-byte key (or 64-character hex). No automatic backup storage or import-apply endpoint is enabled yet.

See `../docs/GENESIS_MCP_PRIVATE_SPEC_0.1.md`, `../docs/GENESIS_IMPORT_APPLY_DESIGN_0.1.md`, `../docs/GENESIS_SECURE_ARTIFACT_STORAGE_0.1.md`, and `../docs/GENESIS_DATA_RETENTION_AND_DELETION_0.1.md` for security and release gates.
