# GENESIS PRIVATE — MCP Integration Specification 0.1

## Purpose

Provide a narrowly scoped bridge between the private GENESIS owner account and MCP-compatible clients. The assistant may retrieve only the data needed for a user-requested task. GENESIS remains the canonical store; the model is not the owner of the data and does not gain broad database privileges.

## Implemented now: local stdio bridge

Command: `npm run mcp:stdio`

Required environment:

- `DATABASE_URL` — private PostgreSQL connection.
- `GENESIS_MCP_OWNER_USER_ID` — exact GENESIS owner ID. The process refuses to start without it.

The bridge uses the existing Prisma schema and a read-only tool registry. It writes protocol messages to stdout only; operational errors go to stderr. It does not bind a TCP port or expose an HTTP endpoint.

### Tool catalogue

| Tool | Data | Permission boundary |
|---|---|---|
| `genesis.get_overview` | Aggregate counts | Owner-scoped; no record content |
| `genesis.get_personal_profile` | Personal Model profile | Owner-scoped; call only on direct request |
| `genesis.list_worlds` | Nine Worlds | Owner-scoped |
| `genesis.list_goals` | Goals and world labels | Owner-scoped; max 50 |
| `genesis.list_projects` | Projects and goal labels | Owner-scoped; max 50 |
| `genesis.list_actions` | Actions and related labels | Owner-scoped; max 50 |
| `genesis.search_memories` | Memory content and source metadata | Owner-scoped; active + explicit context grant only; max 20 |
| `genesis.get_life_timeline` | User-authored life events | Owner-scoped; max 50; use only when directly relevant |
| `genesis.list_conversations` | Conversation titles and timestamps | Owner-scoped; metadata only; use on explicit request |
| `genesis.get_conversation` | One conversation and recent messages | Owner-scoped; explicit conversation ID required |
| `genesis.get_memory_history` | Memory version snapshots | Active + explicit context grant required; max 30 |

No write, delete, account, credential, billing, file-upload, arbitrary SQL, shell, browser or external-action tools are exposed.

## Authorization model

### Local stdio

The local bridge is launched by the user's MCP client as a child process. Process access is controlled by the local OS account and the MCP client's configured environment. The bridge requires an explicit owner ID and scopes every query to it. This is intentionally read-only.

### Remote ChatGPT connection — not yet implemented

A remote MCP service must not reuse the local stdio trust model. Before remote access is enabled, implement and independently test:

1. HTTPS-only Streamable HTTP endpoint and strict `Origin` validation.
2. OAuth 2.1 authorization code flow with PKCE for public clients.
3. Protected Resource Metadata (RFC 9728) and Authorization Server Metadata (RFC 8414) discovery.
4. Audience/resource-bound access tokens; validate issuer, audience, expiry and scopes on every request.
5. Short-lived access tokens and refresh-token rotation/replay detection.
6. Exact redirect URI allow-list and state/nonce validation.
7. Per-tool OAuth security schemes and least-privilege scopes.
8. Owner account consent, token revocation, audit trail and rate limits.
9. HTTPS hosting, secret rotation, backups, monitoring and incident response.
10. ChatGPT custom-app linking and end-to-end tests against the actual client.

Never accept a static owner token as a substitute for the remote OAuth flow. Never expose a local stdio server directly to the network.

## Future tool permission tiers

- `read:profile`, `read:worlds`, `read:goals`, `read:projects`, `read:actions`
- `read:approved_memory` — only individually granted memories
- `read:life_timeline` — separate sensitive scope
- `write:records` — not enabled; future tools require explicit user confirmation for each mutation
- `delete:records`, `account:export`, `account:delete`, `external:execute` — excluded from initial MCP release

## Protocol and transport

- Current local implementation: newline-framed JSON-RPC over stdio, limited to `initialize`, `notifications/initialized`, `ping`, `tools/list` and `tools/call`.
- Remote target: MCP Streamable HTTP. Protocol compatibility must be tested against the SDK/client versions in use; do not assume a transport revision is backward-compatible.
- Prefer the official TypeScript MCP SDK when adding the remote transport. The local tool registry is transport-independent and can be reused.

## Acceptance gates

- Cross-owner access tests for every tool.
- Denied/private memories never returned.
- Tool schemas reject extra arguments and enforce limits.
- No personal content or secrets in logs.
- Invalid tokens, wrong audience, expired tokens, revoked grants and hostile Origin all fail closed.
- No write tool until explicit confirmation semantics and audit persistence are verified.

## Current implementation references

- MCP authorization specification: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
- MCP Streamable HTTP transport: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports/streamable-http
- OpenAI Apps SDK build guidance: https://help.openai.com/en/articles/12515353-building-with-the-apps-sdk
- OpenAI MCP authentication guidance: https://developers.openai.com/plugins/build/auth

The local stdio transport does not implement or claim OAuth. Remote transport must be built against the current MCP specification and tested against the target ChatGPT client before enabling it.
