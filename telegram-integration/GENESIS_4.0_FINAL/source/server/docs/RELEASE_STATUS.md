# GENESIS 1.0 — Release status

**Build target:** private cloud beta  
**Source status:** initial implementation package created  
**Cloud status:** not deployed  
**Runtime verification:** pending dependency installation and provisioned PostgreSQL/OpenAI credentials

## Capability truth table

| Capability | Source implementation | Verified against live infrastructure |
|---|---:|---:|
| Responsive COMMAND UI | Yes | Pending browser test |
| Registration / login | Yes | Pending database test |
| User data isolation | API queries scoped by user ID | Pending integration tests |
| Nine Worlds | Yes | Pending database test |
| Actions | Yes | Pending database test |
| Memory CRUD and classification | Yes | Pending database test |
| Personal Model + version snapshots | Yes | Pending database test |
| ORACLE server-side API | Yes | Pending live provider test |
| Local Ollama adapter | Yes, optional chat + 1536-dimension embeddings | Pending live Ollama test |
| Local MCP stdio bridge | Read-only source + owner-scoped tools + bounded JSON-RPC handshake | Pending generated Prisma client and live DB test |
| Remote MCP / ChatGPT app | No | OAuth 2.1 + HTTPS transport not implemented |
| AES-256-GCM backup envelope | Bounded helper + unit tests | Persistent backup storage/restore not integrated |
| Import preview receipts | Durable nonce ledger + atomic consume helper | Migration and concurrent DB consumption pending |
| Artifact quarantine | Private storage adapter + signature checks + tests | Not wired to API; malware scanner and live filesystem deployment pending |
| pgvector semantic retrieval | Yes, migration + API path | Pending provider extension test |
| Export / delete | Yes | Pending database test |
| Voice | No | Not available |
| Remote external connectors / write agents | No | Not available; no remote OAuth or write tools |
| Managed backups / MFA / rate limits | Provider configuration or future work | Not available in this build |

## Release gate

Do not call this production-ready until migrations apply cleanly, typecheck/build pass, auth and tenant-isolation tests pass, vector retrieval is verified, export/delete are tested, secrets are configured, and backup/restore plus operational controls are active.

## GENESIS 3.0 implementation tranche (working branch)

Implemented but awaiting full dependency-backed verification:
- One-time bootstrap token required for owner registration; PostgreSQL advisory lock serializes concurrent bootstrap attempts.
- Conversation model with legacy message backfill, conversation-scoped chat history and conversation API.
- Memory embedding lifecycle fields and content-hash guarded re-embedding.
- Export includes conversations.
- Service worker caches only the app shell, bypasses API/dynamic/authenticated requests and removes only GENESIS-owned old caches.
- Node service-worker policy tests pass (3/3).

Not yet verified: Prisma validation/client generation, DB migration, full TypeScript typecheck, Next.js build, PostgreSQL integration and iOS Safari E2E.


## GENESIS 0.18 — Continuity and security batch

Implemented in source and contract/unit tested:
- Persistent one-time import preview receipt ledger with user/payload/schema binding and an atomic conditional consume primitive.
- Streaming import request byte cap (10 MiB), strict UTF-8 decoding and durable rate limiting.
- Backup envelope bounds and strict canonical base64url validation.
- MCP handshake state validation, bounded arguments and stricter JSON-RPC checks.
- Private artifact quarantine adapter with server-side hashing, signature allowlist, owner partitioning, restrictive permissions and path/symlink guards.
- Expired receipt maintenance is dry-run by default and requires explicit confirmation to apply.

Still disabled / unverified:
- Import apply, because persistent pre-import backup, conflict policy and real PostgreSQL transaction tests are not complete.
- Binary upload/download endpoints; quarantine adapter is not connected to the Artifact API and has no scanner-clean state.
- Automatic user-content retention/deletion.
- Remote MCP HTTPS/OAuth 2.1 and ChatGPT connection.
- Prisma validation, generated client, semantic typecheck, production build and real database/browser/iOS tests.
