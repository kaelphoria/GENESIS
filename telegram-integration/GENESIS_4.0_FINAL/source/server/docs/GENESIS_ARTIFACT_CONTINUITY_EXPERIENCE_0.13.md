# GENESIS 3.0 — Artifact & Import Continuity Experience 0.13

## Status

**INTEGRATED / CONTRACT-TESTED.** Artifact metadata and import preview receipts are implemented. File-byte storage and import application remain intentionally disabled.

## Artifact experience

- Project workspace can register artifact metadata, select a source and inspect provenance history.
- Artifacts can be archived without deleting history.
- Source trust status is displayed; no source URL is fetched or independently verified.
- API metadata explicitly records that content bytes were not uploaded/stored. `storageUri` and `contentHash` remain null until a secure storage adapter is implemented.

## Import preview receipts

- Valid account export preview returns a short-lived HMAC receipt.
- Receipt binds authenticated user ID, exact raw payload SHA-256, schema version, expiry and nonce.
- Verification uses constant-time signature comparison and fails closed on user/payload mismatch, tampering, expiry or weak secret.
- Preview remains read-only and reports `mutationPerformed=false`; no import apply or database writes exist.

## Verification

- Node contract suite: **99 passed, 0 failed**.
- `git diff --check` passed.
- No binary upload, import apply, cleanup or external transfer was executed.
- Prisma/PostgreSQL integration, Next production build and browser E2E remain unverified because project dependencies and a database are not installed/configured in the current runtime.

## Next autonomous batch

1. Design the import apply transaction and conflict-resolution protocol, then implement it with a verified backup and idempotency. Do not silently replace records.
2. Add artifact file storage only after private object access, size/MIME/content validation, malware scanning hook, server-side hashing and retention are ready.
3. Add user-visible retention controls before deleting user history.
4. Complete reproducible dependency install, Prisma validation, PostgreSQL integration, production build and iOS Safari E2E.
