# GENESIS Life Timeline History — 0.15

## Revision guarantees
- `LifeEventVersion` stores immutable JSON snapshots keyed uniquely by `(eventId, version)`.
- Event creation and event update write the current record and its snapshot in the same database transaction.
- Updates use compare-and-set against the current event version. A stale editor receives HTTP 409 and cannot overwrite a newer revision.
- Detail reads are owner-scoped and return up to 50 revisions, newest first.
- Migration 010 backfills a baseline snapshot for every event already present when the migration runs.
- Account export schema 5 includes both `lifeEvents` and `lifeEventVersions`; import preview validates each version's event reference.
- The UI exposes edit and revision history. Deletion remains explicit and confirmation-gated.

Snapshots are history records, not proof that an event is objectively true. They preserve what the user recorded at each revision.
