# GENESIS 3.0 — Release Candidate 0.19

Status: **private release candidate / infrastructure validation blocked**

This checkpoint improves release operability. It is not a claim of production readiness.

## Added in 0.19

- Environment preflight command: `npm run release:preflight`.
- Production checks for PostgreSQL URL/TLS, 32+ character auth and bootstrap secrets, HTTPS app URL, canonical HTTPS origin, origin consistency, and AI provider configuration warnings.
- Docker Compose now passes the canonical request origin and optional local-provider settings to the application container.
- Preflight checks are dependency-free and can run before Prisma/Next dependencies are installed.

## Verified in this workspace

- Node.js test suite: 158 passing tests.
- Environment preflight: production misconfiguration rejected; valid HTTPS/TLS configuration accepted; development loopback accepted.
- Existing 0.18 import receipt, backup-envelope, MCP, artifact quarantine, provider-boundary and origin tests remain in the suite.

## Release blockers not verifiable in this environment

- npm registry DNS/network is unavailable (`EAI_AGAIN registry.npmjs.org`); no `node_modules` or lockfile is present.
- Docker, PostgreSQL client/server, and Prisma CLI are unavailable.
- Therefore Prisma schema validation/client generation, actual migration application, PostgreSQL transaction/concurrency tests, Next production build, and container build have not been run.
- No external database, domain, hosting account, API key, or production credentials are configured.
- No production deployment or public exposure has been performed.

## Before calling this a production release

1. Restore npm registry connectivity and create/commit a lockfile; install with `npm ci` thereafter.
2. Run Prisma validate/generate and the complete Next production build.
3. Apply all migrations to a disposable PostgreSQL + pgvector database; run real DB ownership, transaction, receipt single-use and concurrency tests.
4. Run browser E2E for registration, login/logout, dashboard, ORACLE, memory grants/revokes, export, and account deletion.
5. Configure TLS, managed encrypted backups/PITR and complete a restore drill.
6. Configure monitoring, alerting, request limits, MFA/recovery and incident response.
7. Perform security review and only then deploy behind private access.

## Safe deployment stance

The product remains single-owner-first. Do not enable public registration, expose a public MCP endpoint, accept binary artifacts, or enable import-apply until their separate security gates are completed. The original archives remain untouched; all changes are on the isolated feature branch.
