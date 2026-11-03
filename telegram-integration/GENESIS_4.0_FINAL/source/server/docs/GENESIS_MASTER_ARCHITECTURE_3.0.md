# GENESIS MASTER ARCHITECTURE 3.0

**Unified Personal Intelligence Infrastructure**  
**North star:** AI expands. Human decides. Human remains the author.

## 1. Product definition

GENESIS is a user-owned personal intelligence infrastructure. It connects personal knowledge, projects, decisions, actions, creative work and approved external tools into one coherent system. It is not a replacement for human agency and is not defined by a single AI provider.

The product must remain useful when cloud AI is unavailable, portable across providers and devices, inspectable by its owner, and safe to evolve over many years.

## 2. Architectural principles

1. **Human sovereignty:** the user owns data, permissions, decisions and consequential actions.
2. **Local-first resilience:** capture and core personal workflows should remain available offline where technically possible.
3. **One domain, many experiences:** web, iPhone PWA, voice and future clients use shared domain contracts.
4. **Modular monolith first:** clear internal modules and stable interfaces; no premature microservices.
5. **Provider independence:** model providers are adapters behind a server-side AI gateway.
6. **Evidence before inference:** all important knowledge has provenance and epistemic status.
7. **Temporal continuity:** preserve history and allow reconstruction of past states.
8. **Reversible evolution:** schema changes are additive where possible; releases have backups, migrations and rollback plans.
9. **Least privilege:** capabilities receive only the data and permissions needed for a specific task.
10. **Observable by design:** failures, cost, latency, data lifecycle and model quality are measurable.

## 3. Target system layers

### Experience layer
- Universe: spatial/navigation experience over the domain model.
- COMMAND: system overview and daily orientation.
- ORACLE: conversational interface to intelligence capabilities.
- MEMORY: inspectable knowledge and provenance.
- DECISION: scenario analysis and decision records.
- EXECUTION: projects, milestones, workflows and actions.
- iPhone PWA: local-first mobile client.
- Future voice/spatial clients: optional, permission-based interfaces.

### Intelligence layer
- Intent Engine: classifies the user's requested outcome and asks before consequential interpretation.
- Context Engine: assembles a scoped, explainable context manifest.
- Cognitive Router: chooses provider/model/tool based on quality, privacy, latency, availability and budget.
- Specialist capabilities: research, analysis, architecture, creative work, planning and development.
- Evaluation Engine: regression tests for quality, grounding, privacy and cost.

### Domain capabilities
- Personal Model and Nine Worlds.
- Knowledge Fabric and Temporal Memory.
- Decision Lab and scenario simulation.
- Project, milestone, task and workflow execution.
- Creative Intelligence and artifact production.
- Personal Timeline and Pattern Recognition.
- Capability Registry and connector adapters.

### Data and continuity layer
- Canonical PostgreSQL domain store.
- Vector retrieval as an optional index, never the only source of truth.
- Provenance and audit events.
- Versioned profile, memory and decision records.
- Import/export and portable snapshots.
- IndexedDB local store and sync outbox.

### Infrastructure layer
- Private application server and PostgreSQL/pgvector.
- AI provider adapters and optional local models.
- Object storage for user artifacts and backups.
- Background job runner for bounded tasks.
- Observability, backup/restore, rate limits and budget controls.

### Trust and governance plane
A cross-cutting layer applied to every capability: authentication, authorization, consent, data classification, context permissions, auditability, retention, deletion, export, safety policies and human approval gates.

## 4. Canonical domain model (target)

- User, Device, Session, PermissionGrant, AuditEvent.
- PersonalProfile, ProfileVersion, World, WorldContext, WorldAssessment.
- Goal, Milestone, Action, Project, Artifact.
- Conversation, ChatMessage, ConversationSummary.
- MemoryRecord, MemoryVersion, MemoryEmbedding, Source, ProvenanceEvent.
- Decision, Scenario, Assumption, Experiment, Observation.
- Workflow, WorkflowRun, Capability, CapabilityPermission.
- SyncDevice, SyncOperation, SyncConflict, BackupSnapshot.

Do not add every entity at once. Add entities when a real workflow requires them and provide a migration/backfill strategy.

## 5. Knowledge model

Every durable knowledge item should eventually support:
- stable ID and owner;
- type/classification;
- source/provenance;
- created/updated/valid-time metadata;
- epistemic status: verified, user-stated, inferred, hypothesis, outdated, conflicting;
- confidence only where meaningful and explainable;
- links to worlds, projects, decisions and artifacts;
- visibility and AI-use permissions;
- version history and deletion lifecycle.

An embedding is a derived index. It must be reproducible from canonical content, versioned by model, and invalidated when source content changes.

## 6. Context assembly contract

Every AI request should be assembled through a context manifest containing:
- request intent and selected capability;
- conversation and user scope;
- exact records included and why;
- excluded categories and permission decisions;
- source timestamps and freshness;
- provider/model selection and estimated cost;
- whether external retrieval is used.

The user-facing system should make context controls understandable. Sensitive categories are excluded by default unless explicitly authorized.

## 7. Capability contract

Each capability declares:
- stable name/version;
- input/output schema;
- required permissions and data scopes;
- provider/tool dependencies;
- cost and timeout budget;
- side-effect level;
- retry/idempotency behavior;
- audit events;
- acceptance tests.

Side-effect levels: read-only, draft-only, reversible action, consequential action. Consequential actions require explicit confirmation.

## 8. Sync contract

Local client uses IndexedDB behind a repository abstraction. Mutations create outbox operations with stable operation IDs. Server processing is idempotent. Sync uses cursors/versions and explicit conflict records. Important records must not silently use last-write-wins. Local-only data remains local unless the user opts into sync.

## 9. AI and agent governance

Agents are bounded workers, not autonomous principals. Every worker receives a task envelope, scoped context, tool allowlist, token/cost budget, deadline and output schema. Agent outputs are proposals until accepted. The orchestrator records lineage and validates results. No agent can change permissions, export/delete data, spend money or publish externally without explicit user approval.

## 10. Security and operations baseline

- Owner bootstrap must be one-time and protected by a high-entropy secret.
- Durable rate limiting for auth and AI endpoints.
- Origin/CSRF policy for cookie-authenticated mutations.
- HttpOnly, Secure-in-production, SameSite cookies.
- No provider secrets in browser bundles.
- Per-user ownership checks on every record access.
- Redacted structured logs; never log secrets or raw sensitive payloads by default.
- Encrypted backups and tested restore drills.
- Health/readiness endpoints and alerting.
- Dependency and migration review before release.

## 11. Evolution model

GENESIS may analyze its own performance and propose code changes. Changes are created in isolated branches/sandboxes, run through tests and security checks, reviewed as diffs, and promoted only through an authorized release process. The system cannot silently rewrite its production core.

## 12. Definition of done

A capability is:
- **WORKING** when the end-to-end user scenario succeeds;
- **INTEGRATED** when it uses canonical contracts and shared permissions;
- **VERIFIED** when tests, failure cases, privacy checks and operational requirements pass.

A visual mockup or untested API is not a completed capability.


## Personal Continuity — Life Timeline (0.14)
Life Timeline stores explicit user-authored events over time and can connect them to projects, decisions and registered sources. It remains distinct from inferred personal traits and from unverified external claims. Account export schema 4 preserves the event collection; import preview validates its cross-record references.


## Goal System (0.16)
Goal is the outcome layer between Nine Worlds and execution. It can be linked to Projects, Actions, Decisions and LifeEvents. These links are owner-validated; deleting a goal preserves the linked records by nulling their optional goal reference. Goals are user-authored and are not automatically inferred or reprioritized by ORACLE. Account export schema 6 includes goals and import preview validates their cross-record links.
