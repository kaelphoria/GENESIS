# GENESIS Next Batch — 1.2

## Completed in 0.16
- Added first-class Goal model with optional Nine Worlds association.
- Connected Goal to Project, Action, Decision and LifeEvent.
- Added owner-scoped Goal CRUD API and Goals workspace.
- Added goal selection to project, decision, action and Life Timeline creation/edit flows.
- Goal deletion preserves linked records by setting optional goal references to null.
- Account export schema 6 includes goals; import preview validates world and cross-domain goal references.

## Next autonomous work
1. Complete import apply only after verified pre-import backup, exact raw payload hash and receipt revalidation, idempotency, and explicit conflict semantics. Keep apply disabled until integration-tested.
2. Design secure artifact storage with private access, file limits, content validation, malware-scan integration point, server-side hashing and retention controls before enabling uploads.
3. Define user-visible retention/deletion guarantees.
4. Establish lockfile and disposable PostgreSQL + pgvector integration environment when package/runtime availability permits.
5. Run Prisma validation/client generation, full typecheck, production build, database/API integration and iOS Safari E2E.

## Release gate
Contract tests and TypeScript syntax parsing do not equal a production release. No external sync, paid API usage, binary file upload, data-sharing, production deployment or destructive user-data operation is authorized by this plan.
