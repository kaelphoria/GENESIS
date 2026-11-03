# GENESIS — Safe Import Apply Design 0.1

**Status: import preview only. Apply endpoint intentionally absent.**

## Existing protections

- Preview is same-origin and authenticated.
- Raw JSON is bounded to 10 MiB.
- SHA-256 is calculated over the exact raw request bytes.
- Preview checks schema version, collection types, duplicate IDs and dangling references.
- HMAC receipt is bound to owner ID and exact payload hash, expires after ten minutes, and requires a 32-byte `AUTH_SECRET`.

## Required apply protocol

1. Receive the exact raw payload bytes; do not parse and reserialize before hashing.
2. Re-run validation and calculate the same raw SHA-256.
3. Verify the signed receipt, owner, payload hash, schema version and expiry.
4. Atomically claim a one-time import run using a unique `(userId, payloadHash)` key and receipt nonce. Concurrent replays must return the prior result, not apply twice.
5. Generate a complete current-account export from the database inside a consistent snapshot/transaction.
6. Encrypt that pre-import snapshot with the AES-256-GCM backup envelope. Abort if the backup key is missing or verification fails.
7. Persist and verify the backup before any user data mutation.
8. Produce a deterministic import plan with counts for create/no-op/conflict and a complete reference remap.
9. Initial conflict policy: merge-only; never overwrite an existing record. Same ID + identical canonical record is a no-op; same ID + different content is a conflict that aborts the entire import. No replace mode.
10. Apply all changes in a transaction, preserve provenance and versions, and write an audit receipt with backup hash and import hash.
11. Verify post-import counts and references before marking the run complete.
12. A failed transaction must leave the account unchanged; a completed import must be idempotent.

## Why apply remains disabled

- No disposable PostgreSQL/pgvector environment is available in this workspace.
- Prisma client generation and migration application have not been verified.
- The import graph needs a tested ID-remapping strategy for imports into a different owner/account.
- Backup persistence, one-time nonce storage and transaction semantics need real database tests.

Contract tests alone are insufficient for a destructive multi-table import. Do not add an apply route until the complete protocol passes integration and restore tests.
