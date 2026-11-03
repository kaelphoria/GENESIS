# GENESIS — Data Retention and Deletion Policy 0.1

**Status: documented baseline; user-facing retention controls and backup lifecycle are not yet implemented.**

## Current behavior

- Account data remains in the database until the user deletes individual records or deletes the account.
- Memory records default to `contextPermission=denied`; granting AI context is a separate per-record action.
- Conversation history, messages, memory versions, Life Timeline versions, provenance and audit history have no automatic expiry policy in this build.
- Rate-limit buckets are operational metadata and are eligible for cleanup after at least seven days. The maintenance script is dry-run by default and cannot delete user records.
- Account deletion requires the exact confirmation phrase `DELETE MY GENESIS DATA`; database relations are configured to cascade from the account owner.
- Account export is available as JSON. A verified restore/backup lifecycle is not yet complete.

## Proposed user-facing guarantees

1. No user-authored record is automatically deleted by a background cleanup job.
2. Archiving is not deletion. Archived records remain exportable and recoverable until explicitly deleted.
3. Deleting a record removes it from normal retrieval immediately and cascades only to dependent data whose lifecycle is defined by the schema; unrelated records are preserved.
4. Account deletion removes the owner row and dependent database records through verified cascading relations. This guarantee is not production-certified until an integration test proves every relation and any external object store is included.
5. Backups must have a published expiry, deletion workflow and restore test before they are enabled. A backup may retain deleted data until its own expiry; this must be disclosed before creation.
6. External AI providers, future connectors and hosting providers require separate disclosure of data sent, purpose, retention and deletion path.
7. The user can export data before destructive deletion. The product must not silently create a backup that it cannot later locate or delete.

## Not promised yet

- Immediate erasure from database snapshots, infrastructure backups, logs or third-party processors.
- Automatic retention periods for conversations, audit events, versions or encrypted backups.
- Erasure from any external AI provider after a request has been processed.

## Release requirements

- Add a per-category retention settings surface with clear defaults.
- Add deletion receipts and an auditable deletion job for object storage.
- Test account deletion against every Prisma relation and object-store object.
- Define backup rotation and deletion before enabling automatic backups.
- Keep the user-facing language aligned with the actual infrastructure configuration; do not claim erasure where provider backups still retain copies.
