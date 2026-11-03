# GENESIS Next Batch — 1.1

## Completed in 0.14–0.15
- Life Timeline domain model, owner-scoped API, dashboard workspace and filters.
- Optional links from events to projects, decisions and sources with ownership checks.
- Optimistic event update version checks.
- Account export schema 5 and import preview support through schema 5, including dangling-reference validation.
- Immutable LifeEventVersion snapshots on create/update, baseline migration backfill and UI edit/history controls.

## Next autonomous work
1. Add a user-visible event edit/history experience and event provenance/version snapshots.
2. Complete import apply only after verified pre-import backup, receipt revalidation against exact raw payload hash, idempotency and explicit conflict-resolution semantics. Keep apply disabled until the protocol is fully testable.
3. Add artifact secure-storage adapter only after private access controls, file size/content validation, malware-scan integration point, server-side hashing and retention controls exist.
4. Define retention and deletion guarantees before any user-content cleanup.
5. Establish reproducible dependency lockfile and disposable PostgreSQL + pgvector integration harness when package/runtime availability permits.
6. Run Prisma validation/client generation, full typecheck, Next.js production build, DB/API integration and iOS Safari E2E.

## Release gate
A passing contract suite is not a production release. No external sync, paid API usage, binary file upload, data-sharing, production deployment or destructive user-data operation is authorized by this plan.
