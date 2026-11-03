# GENESIS 3.0 — Next Autonomous Batch 1.0

## P0 — Import apply design and implementation
- Verify the HMAC preview receipt and exact payload hash on apply.
- Require explicit merge or replace mode and an explicit confirmation phrase for replace.
- Generate a full restorable backup and verify it before mutation.
- Use idempotency and dependency-ordered transactions; report partial failure without claiming success.
- For merge, never overwrite existing profile, memory, project, decision or artifact records silently; produce conflicts requiring resolution.
- Audit preview, apply, rollback and conflict decisions.

## P1 — Secure artifact storage
- Storage provider abstraction with private-by-default objects and owner-bound signed download.
- File size, MIME allowlist, content sniffing, malware scan integration point, server-side SHA-256 and immutable versions.
- No arbitrary URL fetching, no public buckets and no client-trusted content hashes.

## P1 — Retention and privacy
- Define user-visible retention by data class.
- Export/delete guarantees for chat requests, messages, audit events, memory versions, provenance and artifacts.
- No automatic deletion of user content before policy and controls are implemented.

## P0 — Release validation
- Lockfile and clean `npm ci`.
- Prisma validate/generate and migrations 001–008 on PostgreSQL + pgvector.
- Typecheck, full tests, Next production build, API integration and browser E2E.
- iPhone Safari local-first restore, offline and backup/import workflows.

## Approval boundaries
External transfer, paid spend, production deployment, irreversible deletion and permission expansion still require explicit user approval.
