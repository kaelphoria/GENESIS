# GENESIS Next Batch — 1.3

## Completed in 0.17
- Optional local Ollama provider integrated behind the server-side provider router.
- Personal context defaults to off at the API boundary.
- Context manifest includes linked-source trust metadata and user-entered confidence without upgrading evidence trust.
- Local read-only stdio MCP bridge with 11 owner-scoped tools and protocol/tool contract tests.
- AES-256-GCM backup envelope helper.
- Import-apply, artifact-storage, retention/deletion and private MCP/OAuth specifications.
- Free infrastructure options researched and documented.

## Next autonomous work
1. Dependency recovery: npm install/lockfile, Prisma validation/client generation, full typecheck and Next.js production build.
2. Disposable PostgreSQL + pgvector: migration application, tenant-isolation tests, chat/idempotency integration, export/restore drills.
3. Remote MCP: official SDK + Streamable HTTP + OAuth 2.1/PKCE + metadata discovery + audience-bound scopes + refresh rotation + strict Origin validation.
4. Private ChatGPT app linking and E2E test only after remote auth and HTTPS hosting are verified.
5. Import apply: encrypted pre-import backup, exact raw-payload hash and receipt revalidation, one-time nonce, idempotency, merge-only conflict semantics and transactional integration tests.
6. Secure artifact storage: private quarantine, signature/MIME validation, malware scan, hashing, quotas, signed downloads and deletion workflow.
7. User-visible retention controls and full deletion verification.
8. Browser and iOS Safari E2E.

## Free infrastructure shortlist
- Neon Free: preferred isolated PostgreSQL/pgvector development/staging candidate; quota and scale-to-zero limits mean it is not the only backup or always-on production layer.
- Cloudflare Tunnel: candidate for HTTPS ingress after remote OAuth is implemented; tunnel connectivity alone is not authorization.
- Supabase Free: viable experiment option, but free projects pause after inactivity and the database quota is smaller.

No external account was created and no service was deployed in 0.17.

## Release gate
No production-ready claim until dependencies install from a committed lockfile, Prisma migrations apply, semantic typecheck/build pass, tenant isolation is verified against real PostgreSQL, backup restore is proven, OAuth/MCP security tests pass, and iOS/browser E2E succeeds.
