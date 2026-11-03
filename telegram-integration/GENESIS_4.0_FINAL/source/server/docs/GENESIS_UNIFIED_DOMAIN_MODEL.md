# GENESIS UNIFIED DOMAIN MODEL

## Core ownership
All personal records belong to a User. Every API access is scoped to the authenticated owner. Cross-user references are forbidden unless a future explicit sharing model is introduced.

## Domain aggregates

### Personal Model
`PersonalProfile` is the editable current projection. `ProfileVersion` stores snapshots. Future `WorldContext` and `WorldAssessment` add dated context and assessments without overloading the World definition.

### Knowledge
`MemoryRecord` is canonical user knowledge. `Source` and `ProvenanceEvent` record origin and transformation. `MemoryVersion` stores revisions. `MemoryEmbedding` is a derived retrieval index and must always be rebuildable.

### Conversation
`Conversation` owns an ordered sequence of `ChatMessage` records. Messages must be scoped by both authenticated user and conversation ownership. Conversation summaries are derived, versioned artifacts, not replacements for raw messages.

### Goal and execution
`Goal` represents a user-chosen outcome and may be associated with one of the Nine Worlds. Projects, actions, decisions and LifeEvents may link to a goal without becoming children that are deleted with it. Goal deletion nulls optional links and preserves those records.

### Action and execution
`Project` groups related work. `Goal` and `Milestone` describe outcomes. `Action` is an executable next step. `Workflow` defines a reusable process; `WorkflowRun` records an execution. Side effects are permission-gated and idempotent.

### Life Timeline
`LifeEvent` is a user-authored temporal record with an explicit occurredAt date, user-selected category and significance, optional links to a Project, Decision and Source, and optimistic versioning. `LifeEventVersion` stores immutable JSON snapshots of each revision. It is not inferred automatically from conversations or external accounts.

### Decision
`Decision` stores the question, options, selected outcome and rationale. `Scenario` stores alternative paths and assumptions. `Experiment` and `Observation` track evidence gathered after a decision.

### Artifacts
`Artifact` represents generated or imported files/documents with type, source, version, storage pointer, content hash and access policy.

### Sync
`SyncDevice` identifies an authorized device. `SyncOperation` is an idempotent mutation. `SyncConflict` preserves unresolved conflicts. A sync cursor tracks server progress.

## Epistemic statuses
- `USER_STATED`: explicitly provided by user.
- `OBSERVED`: directly observed from an authorized source.
- `VERIFIED`: corroborated according to a defined verification rule.
- `INFERRED`: generated interpretation with supporting evidence.
- `HYPOTHESIS`: tentative possibility.
- `CONFLICTING`: incompatible evidence exists.
- `OUTDATED`: no longer current.

Do not use one generic confidence score as a substitute for source quality or epistemic status.

## Temporal model
Use `createdAt` and `updatedAt` for record lifecycle. Add `validFrom`/`validTo` only when the domain needs to represent when a fact was true in the user's world. Preserve revisions rather than overwriting meaningful historical changes.

## Migration rules
- Add new columns nullable or with safe defaults.
- Backfill before adding NOT NULL constraints.
- Preserve old records and export compatibility.
- Add indexes only for measured access patterns.
- Test migrations on a copy and verify rollback/restore path.
- Never store embeddings as the only copy of knowledge.
