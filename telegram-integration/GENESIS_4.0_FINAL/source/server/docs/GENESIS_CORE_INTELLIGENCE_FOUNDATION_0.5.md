# GENESIS 3.0 — Core Intelligence Foundation 0.5

## Scope of this checkpoint

This checkpoint extends the existing Context Engine, intent classifier, capability registry, provenance model, conversation continuity and specialist planner. It does not replace the established modular-monolith architecture.

## Temporal memory and session continuity

- Existing profile and memory records retain immutable version snapshots; Life Timeline events retain their own revision history.
- Provenance events preserve record/source lifecycle changes. The Context Engine now carries linked source trust metadata and user-entered confidence without upgrading a user-saved memory into independently verified evidence.
- Conversation records and messages remain owner-scoped. Chat request idempotency keys prevent duplicate sends; specialist progress traces allow bounded recovery after an interrupted multi-stage response.
- Personal Model, world intentions and approved memories are excluded from ORACLE requests unless the client explicitly sends `includeContext: true`; the server also defaults to context-off.
- The local MCP bridge exposes prior conversation retrieval and memory history only through explicit read calls; memory history remains gated by the current active + granted state.

## Provider routing

- OpenAI remains supported through the existing server-only SDK adapter.
- Optional Ollama chat and embedding adapters use Node's built-in `fetch`; no additional runtime dependency is required.
- `GENESIS_AI_PROVIDER=ollama` selects the local adapter. `OLLAMA_MODEL` and `OLLAMA_EMBEDDING_MODEL` must be configured explicitly.
- Plain HTTP is accepted only for loopback Ollama endpoints. Non-loopback endpoints require HTTPS; URL-embedded credentials are rejected.
- Chat and embedding calls have finite timeouts. The adapter returns bounded token usage metadata and does not expose upstream response bodies.
- Embeddings must be exactly 1536 dimensions because the current PostgreSQL schema uses `vector(1536)`. A different local embedding model is rejected instead of silently corrupting retrieval.
- The provider selection does not silently change a live deployment. It remains an explicit server environment setting.

## Local MCP bridge

- Added a read-only stdio MCP bridge for one explicitly configured owner.
- Exposes aggregate overview, Nine Worlds, goals, projects, actions, approved-memory search and Life Timeline reads.
- Every database query is scoped to `GENESIS_MCP_OWNER_USER_ID`.
- Memory search only returns records with `status=active` and `contextPermission=granted`.
- Inputs use bounded schemas and result limits. No write, delete, export, external action or account-management tool is exposed.
- The stdio transport is local-process access; it does not open a network port.

## Backup cryptography foundation

- Added an AES-256-GCM backup envelope helper with random 96-bit IV, authentication tag, associated-data binding and plaintext SHA-256 verification.
- Backup keys must be exactly 32 bytes (base64 or 64-character hex); missing or invalid keys fail closed.
- This helper is not yet connected to a backup storage lifecycle or import-apply endpoint.

## Verification

- Full Node test suite: **142 passed, 0 failed** at the final 0.17 candidate run.
- Unit/contract tests cover the Ollama adapter, owner-scoped MCP protocol/tool registry, authenticated backup envelope, context source-trust propagation and provider selection.
- TypeScript/TSX syntax parse: 41 files, 0 syntax errors.
- Full semantic typecheck is blocked by missing Next.js, React, Node and Prisma dependencies/types; it is not marked passed.
- No live Ollama model, generated Prisma client, PostgreSQL/pgvector, MCP host or public HTTPS endpoint is claimed as verified.

## Not included

- Remote MCP Streamable HTTP transport.
- OAuth 2.1 authorization server, protected-resource metadata, PKCE, refresh-token rotation or public HTTPS deployment.
- MCP write tools or autonomous actions.
- Import apply or automatic backup storage.
- Binary artifact upload or malware scanning.
