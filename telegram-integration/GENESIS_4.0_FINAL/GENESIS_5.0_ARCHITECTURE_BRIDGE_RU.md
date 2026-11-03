# GENESIS 5.0 — Architecture Bridge

Этот документ фиксирует восстановленный контур 5.0 для интеграции существующих исходников. Он не выдаётся за оригинальный `MASTER ARCHITECTURE 5.0`: сам оригинальный документ пока не найден среди доступных файлов.

## Product architecture — eight layers

| Layer | Responsibility | Core modules |
|---|---|---|
| Experience | User-facing surfaces | iPhone PWA, Web, Telegram Mini App |
| Personal Context | Explicit personal context | Context Engine, Personal Model |
| Intelligence Core | Reasoning and routing | ORACLE, Cognitive Router, provider adapters |
| Knowledge Fabric | Structured knowledge graph | entities, relations, sources, projects, decisions |
| Memory | Durable personal knowledge | working, episodic, semantic, project, procedural |
| Execution | Plans and actions | goals, tasks, bounded tools, approval gates |
| Trust & Security | User control and safety | identity, permissions, consent, audit, export/restore |
| Evolution | Controlled improvement | Timeline, reflection, Decision Lab, evaluations |

## Required shared contracts

- `UserIdentity`, `World`, `Goal`, `Project`, `Action`, `Decision`, `LifeEvent`.
- `MemoryRecord` with classification, source/provenance, version, context permission, embedding lifecycle and supersession.
- `Conversation`, `ChatRequest`, `AgentTrace` with scoped idempotency and explicit status transitions.
- `Artifact`, `Source`, `ImportReceipt`, `UsageRecord` / `CostEstimate` as distinct types.
- `SyncEnvelope`, `OutboxOperation`, `ServerReceipt`, `ConflictRecord`, `Tombstone`.
- Versioned export envelope with schema version, integrity checks, encrypted backup option and pre-restore rollback.

## System invariants

1. Server is authoritative for authenticated shared state; local PWA remains usable independently.
2. Local-first writes are durable before network send; ACK only after authoritative server receipt.
3. Idempotency keys are unique within explicit owner/scope and duplicate-key conflicts are deterministic.
4. No automatic upload of private context; per-record permission is explicit and revocable.
5. AI provider is replaceable behind one server-side gateway.
6. External write actions require user approval and produce audit events.
7. Migration is additive where possible, versioned, reversible via backup, and never silently destructive.
8. User remains the author of goals, decisions, memories and identity model.

## Release sequence

4.1 Recovery → 4.2 Unified Domain → 4.3 Local-first → 4.4 ORACLE → 4.5 Sync → 4.6 Trust/Security → 4.7 Decision Lab → 4.8 Agents → 4.9 Evolution → 5.0 Unified Intelligence.

This bridge is a working integration contract pending reconciliation with the original MASTER ARCHITECTURE 5.0 source.
