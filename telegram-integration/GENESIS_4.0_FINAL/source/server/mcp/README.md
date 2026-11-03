# GENESIS MCP — local stdio bridge

This process is local-only and read-only. It does not open a network port.

## Start

```bash
GENESIS_MCP_OWNER_USER_ID="your-exact-owner-id" npm run mcp:stdio
```

`DATABASE_URL` must already be configured in the server environment. Never put the database password or backup key in prompts, tool arguments or source control.

## Example MCP client configuration

Replace the executable path and owner ID with values from the machine that runs GENESIS. Keep `DATABASE_URL` in a local secret manager or environment file, not in a shared project file.

```json
{
  "mcpServers": {
    "genesis-private": {
      "command": "node",
      "args": ["/absolute/path/to/genesis/server/mcp/stdio-server.mjs"],
      "env": {
        "DATABASE_URL": "postgresql://...",
        "GENESIS_MCP_OWNER_USER_ID": "owner-id"
      }
    }
  }
}
```

## Exposed tools

- `genesis.get_overview`
- `genesis.get_personal_profile`
- `genesis.list_worlds`
- `genesis.list_goals`
- `genesis.list_projects`
- `genesis.list_actions`
- `genesis.search_memories`
- `genesis.get_memory_history`
- `genesis.get_life_timeline`
- `genesis.list_conversations`
- `genesis.get_conversation`

All are read-only. Memory search and history require active records with an explicit context grant. Conversation and Life Timeline tools are intended for direct user requests to recover relevant history.

## Not a remote ChatGPT connector yet

This stdio bridge cannot be pasted as a URL into ChatGPT. Remote ChatGPT use requires the separate HTTPS Streamable HTTP + OAuth 2.1 work described in `docs/GENESIS_MCP_PRIVATE_SPEC_0.1.md`, a reachable HTTPS deployment and an eligible ChatGPT custom-app connection. No public endpoint or account permission has been changed.


## Protocol and security status (0.18)

The local stdio bridge validates JSON-RPC IDs and parameter shapes, requires the `initialize` → `notifications/initialized` handshake before tools are available, resets state on reinitialization, caps serialized tool arguments at 32 KiB, and rejects oversized partial stdio frames. The bridge remains read-only and owner-scoped. It is not a remote HTTP MCP deployment and does not implement OAuth 2.1.
