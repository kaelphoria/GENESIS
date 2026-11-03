# GENESIS Goal System — 0.16

## Purpose
Goal is a first-class outcome record between a user's life domains and execution records. It is not a replacement for a project, action or milestone: a Goal expresses the result a person chooses, while projects and actions describe ways to move toward it.

## Domain relationships
- Goal belongs to one User and may optionally belong to one World (Nine Worlds).
- Project, Action, Decision and LifeEvent may each optionally reference a Goal.
- Every cross-record link is validated against the authenticated user before it is written.
- Deleting a Goal sets its optional references to null. It does not delete projects, actions, decisions or life events.
- Deleting a World sets Goal.worldId to null.

## API and UI
- `/api/goals`: authenticated list/create/update/delete; mutations require same-origin checks.
- Goal workspace supports title, description, World, priority, target date and lifecycle status.
- Project and Decision creation can select a Goal.
- Action creation can select a Goal.
- Life Timeline events can link to a Goal; the relationship is editable and included in event revision snapshots.

## Portability
Account export schema version 6 includes Goal records. Import preview validates `goals.worldId` and references from actions, projects, decisions and life events. Preview remains read-only.

## Safety
No automatic goal inference or autonomous reprioritization is enabled. Goal status and significance are user-controlled. The system does not assume that a goal is a commitment merely because it was drafted.
