# GENESIS Life Timeline — 0.14

## Purpose
Life Timeline is a user-authored chronological layer for meaningful events, transitions, achievements, challenges and learning. It complements (does not replace) the Personal Model, Memory, Projects and Decision Lab.

## Domain contract
- `LifeEvent` belongs to exactly one user.
- `occurredAt` is the event's date/time, distinct from record creation/update timestamps.
- Category is one of: milestone, transition, achievement, challenge, relationship, learning, health, career, other.
- Significance is a user-selected integer from 1 to 5; GENESIS does not infer importance.
- An event may optionally link to a project, decision and source. Each link is checked against the authenticated user before create/update.
- Deleting a linked project, decision or source leaves the event and nulls that relation. Deleting the account cascades to the user's events.
- Event edits use optimistic version checks to reject stale writes.

## API
`/api/life-events`
- GET: latest 200 events ordered by occurredAt descending, then createdAt descending.
- POST: authenticated, same-origin, validated event creation.
- PATCH: authenticated, same-origin, owner-scoped optimistic update requiring current version.
- DELETE: authenticated, same-origin, owner-scoped deletion.

No automatic event inference, calendar scraping, contacts access or background data collection is enabled.

## UI
Dashboard navigation exposes LIFE TIMELINE. The workspace supports event creation, category/significance selection, filtering, chronology and explicit links to existing projects, decisions and registered sources. Source trust remains visible and is not upgraded by linking.

## Portability
Account export schema version 6 includes `lifeEvents`, immutable `lifeEventVersions` and `goals`. Import preview accepts schema versions through 6 and validates event links, goal links and version-to-event references. Preview remains read-only and receipt-bound; no import-apply operation is enabled in this checkpoint.

## Revision history (0.15)
Every event creation and update writes a JSON snapshot in `LifeEventVersion` in the same database transaction. Snapshots now include the optional goal link. The detail API returns up to 50 snapshots; the workspace exposes edit and revision history. Existing events are backfilled into a baseline snapshot by migration 010. Optimistic version checks prevent stale updates from silently overwriting a newer revision.

## Verification
- Contract suite: 106 tests passed.
- Migration is additive; no existing table or user data is dropped.
- Real Prisma validation, PostgreSQL migration application, production build and browser/iOS E2E remain unverified because project dependencies and a configured database are absent in the current runtime.
