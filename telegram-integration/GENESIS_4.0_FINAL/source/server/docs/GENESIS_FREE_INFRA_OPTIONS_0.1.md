# GENESIS — Free Infrastructure Options 0.1

Checked 2026-11-03. Free tiers change; re-check quotas and terms before moving personal data.

## Recommended shortlist

### 1. Neon Free — PostgreSQL/pgvector development and staging

- $0/month; currently 1 GB PostgreSQL storage per project, 100 CU-hours per project/month, up to 2 CU, 5 GB network transfer per project/month.
- Compute scales to zero after five minutes idle; first request after idle can have cold-start latency.
- Six-hour instant-restore history and one manual snapshot are listed for Free.
- Suitable for a development/staging database and schema/migration tests. Not a complete backup/restore strategy and not an always-on production guarantee.
- GENESIS uses PostgreSQL + pgvector, so verify `CREATE EXTENSION vector` and actual Prisma migrations on a disposable Neon project before any data migration.

Official limits: https://neon.com/docs/introduction/plans

### 2. Cloudflare Tunnel — free connectivity to a privately hosted service

- Cloudflare Tunnel is listed as available on all plans and creates outbound-only connections; the origin does not need an inbound public IP or open inbound ports.
- Publishing a stable application hostname requires a domain on Cloudflare and a running `cloudflared` daemon.
- A quick `trycloudflare.com` tunnel is temporary, changes URL and is for development/testing only; anyone with the URL can reach the service unless separately protected.
- Tunnel provides connectivity, not application authorization. GENESIS still needs OAuth 2.1, audience-bound tokens, owner scopes, rate limiting and Origin validation before remote MCP is exposed.

Official docs: https://developers.cloudflare.com/tunnel/ and https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/

### 3. Supabase Free — alternative managed PostgreSQL

- Two free projects, 500 MB database per project, 5 GB egress and 1 GB file storage in current plan details.
- Free projects pause after one week of inactivity.
- Good for experiments; less attractive than Neon for a small always-used private GENESIS backend because of the inactivity pause and lower DB allowance.

Official plan details: https://supabase.com/pricing

## Not selected for private production data

- Newly surfaced free VM offers may require a payment card shortly after signup or delete the free resources if the card is not added. Do not make GENESIS continuity depend on a newly launched provider without a security, retention and terms review.
- Hosted MCP marketplaces with request caps are not a substitute for a private owner-scoped data plane.

## Decision

- Keep local-first storage and local Ollama as the no-recurring-cost baseline.
- Use Neon Free only for isolated development/staging until migrations, backup/restore and data-retention behavior are verified.
- Use Cloudflare Tunnel as a candidate transport layer after OAuth 2.1 is implemented; do not publish the service yet.
- No account has been created, no credentials have been requested, no data has been transferred and no service has been deployed.
