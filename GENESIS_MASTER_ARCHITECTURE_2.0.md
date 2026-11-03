# GENESIS — MASTER ARCHITECTURE 2.0

**Document status:** Product and technical baseline  
**Date:** 2 November 2026  
**Product identity:** GENESIS — The Living Intelligence  
**Category:** Personal Intelligence Ecosystem  
**Release target:** GENESIS 1.0

---

## 0. Executive decision

GENESIS is not a habit tracker, chatbot wrapper, life-scoring dashboard, or collection of disconnected AI agents. It is a personal intelligence ecosystem that connects a person's context, knowledge, decisions, projects, actions, and learning loops.

Its purpose is to help a person understand their situation, think more clearly, explore options, create things, act deliberately, and learn from outcomes. It must strengthen human agency rather than replace it.

**Core formula:** Understand → Expand → Imagine → Create → Act → Measure → Evolve.

**Constitutional principle:** AI expands. Human decides. Human remains the author.

The product must be ambitious in its long-term architecture and disciplined in what it claims to have implemented. A roadmap item is not a working feature. A generated answer is not verified knowledge. A local prototype is not a secure cloud service.

## 1. Product constitution

These principles govern every feature and release.

1. **Human sovereignty.** The user controls goals, values, data, permissions, and consequential decisions.
2. **Truth over performance theatre.** The system labels facts, user statements, inferences, hypotheses, and unknowns. It never pretends to have capabilities or integrations that are absent.
3. **Evidence and provenance.** Important claims retain their source, timestamp, confidence, and relevant context.
4. **Privacy by design.** Collect the minimum data required. Separate permissions by data category, source, purpose, and destination.
5. **Reversible action.** Consequential operations require approval, provide a preview, and offer cancellation or recovery where possible.
6. **Cognitive independence.** GENESIS should teach the user to reason and act independently, not maximize dependence or engagement.
7. **No identity lock-in.** Personal models are provisional and versioned. People can change; old descriptions must not become permanent labels.
8. **Action over endless analysis.** Insights should lead to optional, measurable experiments or actions, without turning every moment into self-optimization.
9. **Accessible simplicity.** The underlying system may be sophisticated; the user experience should remain calm, clear, and understandable.
10. **Continuous verification.** Features require acceptance tests, quality metrics, and explicit release status.

## 2. Product architecture: four planes

### 2.1 Experience plane

User-facing spaces, available across mobile and desktop:

- **COMMAND:** overview, priorities, current focus, and entry points into the system.
- **ORACLE:** conversational intelligence with selectable reasoning modes.
- **UNIVERSE:** navigable map of personal knowledge, goals, projects, and cross-domain relationships.
- **NINE WORLDS:** nine life domains with their own goals, observations, actions, and histories.
- **STUDIO:** creation workspace for research, concepts, documents, and prototypes.
- **VOICE:** voice journal, live dialogue, briefings, and voice navigation.
- **SETTINGS / CONTROL:** privacy, permissions, data portability, connected services, and audit history.

### 2.2 Intelligence plane

- **CORE ORCHESTRATOR:** chooses tools, models, context, and workflow; applies permissions and budgets.
- **CONTEXT ENGINE:** assembles only relevant, authorized context for the current task.
- **REASONING ENGINE:** decomposes problems, compares options, and produces traceable conclusions.
- **RESEARCH ENGINE:** retrieves external evidence, checks freshness, and records citations.
- **UNCERTAINTY ENGINE:** separates known, inferred, disputed, stale, and unknown information.
- **CAUSAL ANALYSIS:** tests possible causal explanations and explicitly avoids treating correlation as causation.
- **DECISION ENGINE:** structures criteria, trade-offs, risks, scenarios, and approval requirements.
- **SIMULATION ENGINE:** models conditional scenarios; reports assumptions and uncertainty, never presents them as certain forecasts.
- **STRATEGY ENGINE:** turns selected outcomes into milestones, plans, and resource allocations.
- **EXPERIMENT ENGINE:** defines small tests, expected outcomes, measurements, and review dates.
- **EVALUATION ENGINE:** tests answer quality, tool correctness, safety, usefulness, and calibration.
- **MODEL ROUTER:** abstracts model providers and chooses a model by capability, cost, latency, privacy, and availability.

### 2.3 Knowledge plane

- **Personal Model:** user-editable, versioned representation of goals, preferences, values, constraints, skills, and current context.
- **Memory:** explicit long-term records and user-approved summaries.
- **Working Context:** short-lived context for an active task or conversation.
- **Thought Graph:** entities and relationships among ideas, beliefs, goals, events, decisions, and projects.
- **Knowledge Base:** external and personal materials with source metadata and retrieval permissions.
- **Timeline:** dated events, changes, decisions, experiments, and outcomes.
- **Provenance Ledger:** source, owner, timestamp, classification, confidence, and transformation history for important data.

### 2.4 Foundation plane

- Authentication and identity.
- Authorization and consent management.
- Encrypted transport and encrypted storage.
- Database, object storage, and backups.
- API gateway and model-provider adapters.
- Connector framework and scoped credentials.
- Audit logging, monitoring, rate limits, and abuse controls.
- Data export, deletion, retention, and recovery.
- Deployment, observability, incident response, and release management.

**Cross-cutting subsystem:** GENESIS EVOLUTION reviews the product, personal model, and workflows. It does not silently rewrite its own production code or permissions.

## 3. Core modules and boundaries

| Module | Owns | Must not own |
|---|---|---|
| CORE | Orchestration, tool selection, policy enforcement | Canonical user records or UI state |
| MIND | Cognitive exercises, reasoning profiles, learning plans | Psychological diagnosis or fixed identity labels |
| VOICE | Audio capture, transcription, speech output, voice session state | Independent hidden memory store |
| MEMORY | User-approved records, retrieval, retention | Unreviewed permanent conclusions |
| PERSONAL MODEL | Current editable profile and version history | Claims of objective personality measurement |
| NINE WORLDS | Domain-specific goals, observations, actions, measures | Nine isolated copies of the same user data |
| ACTION | Tasks, milestones, status, completion evidence | Automatic execution without authorization |
| STUDIO | Creation projects and artifacts | Untracked or unowned external publication |
| SIMULATION | Scenario assumptions and conditional outcomes | Certain prediction or false precision |
| SECURITY | Identity, permissions, audit, lifecycle | Product analytics without consent |

One canonical data layer serves all modules. Voice, MIND, ORACLE, and the nine worlds must not create competing memories or duplicate profiles.

## 4. Canonical data model

Every important record should support:

- `id` — stable identifier.
- `type` — entity or record type.
- `created_at`, `updated_at` — timestamps.
- `owner_id` — user or workspace owner.
- `source` — user input, connector, model output, or external source.
- `classification` — sensitivity and handling category.
- `status` — draft, active, archived, deleted, or superseded.
- `confidence` — only where a confidence estimate is meaningful.
- `provenance` — source references and transformation history.
- `permissions` — allowed purposes, processors, and destinations.

### Required epistemic labels

- **VERIFIED FACT:** independently supported by a reliable source or direct measurement.
- **USER STATEMENT:** reported by the user; not independently verified.
- **SELF-ASSESSMENT:** the user's subjective evaluation.
- **OBSERVATION:** recorded event or pattern, with method and date.
- **HYPOTHESIS:** explanation that remains to be tested.
- **AI INTERPRETATION:** model-generated analysis, not a fact.
- **EXTERNAL EVIDENCE:** sourced information with citation and date.

A model-generated interpretation must never silently become a verified fact or permanent memory. Memory creation from conversations should require explicit user approval or a clearly configured opt-in rule.

### Core entities

`User`, `ProfileVersion`, `Goal`, `World`, `Action`, `Project`, `MemoryRecord`, `ConversationSummary`, `Thought`, `Relationship`, `Decision`, `Scenario`, `Experiment`, `Observation`, `Source`, `Connector`, `PermissionGrant`, `AuditEvent`, `Artifact`.

## 5. NINE WORLDS: common domain contract

1. IDENTITY — values, self-definition, character, beliefs.
2. INTELLECT — learning, knowledge, attention, reasoning, memory skills.
3. PSYCHE — emotions, attachment patterns, self-worth, coping, reflection.
4. PHYSICAL — sleep, activity, nutrition, energy, recovery, health data where authorized.
5. AESTHETICS — taste, style, visual literacy, self-expression.
6. CONNECTION — relationships, communication, boundaries, social context.
7. CREATION — talents, career, craft, products, projects.
8. ABUNDANCE — money, capital, resources, financial planning.
9. SPIRIT — meaning, worldview, faith, reflection, spiritual practice.

Each world implements the same contract:

- Current context and user-defined intention.
- Goals and milestones.
- Observations and evidence.
- Actions and experiments.
- Measures chosen by the user.
- Timeline and review history.
- Links to other worlds.

Do not impose a universal 1–10 score as a measure of a person's worth or objective progress. Any self-rating is optional, subjective, contextual, and time-stamped. Prefer meaningful indicators and qualitative reflection over gamified scoring.

## 6. Cross-domain intelligence

The system should identify potentially relevant relationships between worlds, but must distinguish:

- observed co-occurrence;
- user-reported relationship;
- plausible hypothesis;
- evidence-supported causal mechanism;
- tested personal experiment.

Example: sleep and concentration may move together. GENESIS can surface the pattern, ask whether other factors changed, and propose a bounded experiment. It must not conclude that sleep caused the change without adequate evidence.

## 7. Multi-intelligence and agent orchestration

Specialist roles (Strategist, Scientist, Analyst, Critic, Creator, Economist, Philosopher, and domain specialists) are capabilities, not autonomous personalities. They may be implemented as prompts, tool policies, model choices, or bounded workflows.

Orchestration rules:

1. Define the user's objective and constraints.
2. Retrieve the minimum relevant authorized context.
3. Decide whether external research or tools are needed.
4. Assign specialist passes only when they add value.
5. Ask for adversarial review on high-impact or uncertain questions.
6. Synthesize agreement, disagreement, assumptions, and unknowns.
7. Cite external evidence and preserve provenance.
8. Present recommendations with options and trade-offs.
9. Require approval before consequential actions.
10. Record outcome feedback only under the user's memory settings.

Do not run many agents merely to simulate intelligence. Use the smallest workflow that reliably solves the task.

## 8. Voice architecture

Five user experiences:

- VOICE JOURNAL — explicit recording, transcription, optional structuring, user-approved save.
- LIVE CHECK-IN — adaptive dialogue, not a rigid questionnaire.
- ORACLE VOICE — open conversation with context and reasoning modes.
- INTELLIGENCE BRIEFING — opt-in spoken summary.
- THINKING PARTNER — co-reasoning, exploration, and project development.

Data layers and permissions must be separate:

1. Raw audio.
2. Transcript.
3. Extracted notes or summaries.
4. Long-term memory.
5. Analytics.

Default: no always-on listening. Recording must be explicitly started and visibly indicated. Deleting a transcript must not be confused with deleting raw audio or derived memories.

## 9. Personal Model, Memory, and cognitive independence

Personal Model is an editable hypothesis about current user context, not a psychological truth. It needs versioning, dates, confidence, user corrections, and a way to compare changes without treating past versions as permanent identity.

Memory tiers:

- Working memory: current task/session.
- Episodic memory: user-approved events and conversation summaries.
- Semantic memory: stable user-approved preferences, goals, and knowledge.
- Project memory: decisions, files, open questions, and progress for a project.

Every stored memory needs provenance, scope, retention rules, and deletion behavior. The user must be able to inspect, correct, export, and delete it.

MIND includes three explicit modes:

- THINK WITH ME — collaborative reasoning.
- TEACH ME TO THINK — explain the method and build independent skill.
- CHALLENGE MY THINKING — test assumptions and offer counterarguments.

Also provide MIRROR, SOCRATIC, ANALYST, ARCHITECT, VISIONARY, and SAGE interaction styles. The user can opt out of self-analysis and simply have an ordinary conversation.

## 10. Decision, simulation, and action loop

A common operating loop spans the whole product:

`UNDERSTAND → DISCOVER → DESIGN → APPROVE → ACT → MEASURE → LEARN`.

Decision records include objective, options, criteria, assumptions, evidence, risks, reversibility, and chosen path. Scenario outputs show assumptions and ranges, not false precision.

Actions support owner, world, priority, due date, status, dependencies, completion evidence, and review. External execution requires a permission check and, when consequential, explicit confirmation. Actions must be auditable and cancellable where technically possible.

## 11. Security, privacy, and governance

### Security baseline for 1.0

- Secure authentication and session management.
- Authorization checks on every API and data operation.
- Encryption in transit and at rest using maintained platform primitives.
- Secrets stored server-side; never ship provider API keys in browser code.
- Scoped connector credentials and revocation.
- Audit trail for access, export, deletion, and delegated actions.
- Rate limits, abuse protection, input validation, and dependency scanning.
- Tested backup and restore procedures.
- Incident response and vulnerability reporting process.

### Privacy controls

- Permissions by source, category, purpose, processor, and retention.
- Clear disclosure before data is sent to an AI provider or connector.
- User-accessible export and deletion.
- Data minimization and default-off optional integrations.
- Separate controls for audio, transcripts, health, finance, relationships, and documents.
- No secondary use of personal data without explicit authorization.

A browser-only local prototype is not a secure private vault. Browser storage is not encrypted by this product and may be cleared by the browser or device.

## 12. Technical reference architecture

Recommended initial architecture (implementation choice, not a commitment to a specific vendor):

- **Client:** responsive web application with accessible components and progressive enhancement.
- **Backend:** typed API service with explicit authorization and validation.
- **Database:** relational database for canonical entities and transactions.
- **Search:** hybrid lexical/vector retrieval with record-level permission filters.
- **Object storage:** encrypted file/audio storage with retention policies.
- **AI gateway:** provider-agnostic model routing, prompt/version management, budgets, logging controls.
- **Jobs:** asynchronous ingestion, transcription, indexing, and scheduled opt-in briefings.
- **Observability:** structured logs, metrics, traces, error reporting, and privacy-aware audit events.

Architecture requirements:

- API contracts are versioned.
- Database schema changes use migrations.
- AI provider calls are isolated behind adapters.
- User data is never exposed to a model before authorization and minimization.
- Retrieval enforces permissions before ranking and generation.
- All external actions use scoped tokens and idempotency where applicable.
- Backups are encrypted and restore-tested.

## 13. GENESIS 1.0 scope: what “complete” means

GENESIS 1.0 is not every imaginable future capability. It is a coherent, secure, daily-usable product with the following release commitments:

### P0 — mandatory for 1.0

- Responsive mobile and desktop experience.
- Account, authentication, and multi-device sync.
- Canonical database and versioned data model.
- Personal Model with history and user corrections.
- Memory: create, retrieve, search, edit, approve, export, and delete.
- AI ORACLE connected to at least one real model through a secure server-side gateway.
- Context Engine with user-visible sources and uncertainty labels.
- COMMAND and all nine worlds using one shared data model.
- Goals, actions, milestones, due dates, status, and review history.
- Decision workflow and basic experiments.
- Data export, deletion, backup, restore, and permission controls.
- Security baseline and release testing.
- Clear feature status and operational monitoring.

### P1 — include if reliable and tested before release

- Voice journal and speech interface.
- Thought Graph and cross-domain relationship explorer.
- Research citations and external source library.
- Project Studio and artifact workspace.
- Opt-in briefings and reminders.

### Explicitly not required for 1.0

- Always-on listening.
- Fully autonomous agent with broad account permissions.
- Predictive life scoring or deterministic future forecasts.
- Medical, psychological, or financial diagnosis.
- Full spatial/AR interface.
- A custom foundation model trained from scratch.
- Dozens of integrations without clear user value.

These remain possible future directions, not promises.

## 14. Release roadmap and gates

| Release | Outcome | Exit gate |
|---|---|---|
| 0.1 Foundation | Local prototype | Basic flows demonstrable |
| 0.2 Usability & data integrity | Search, edit, schema validation, world records, safer backup | Regression tests pass; migration preserves 0.1 data |
| 0.3 Backend foundation | Authentication, API, database, sync | Multi-device data consistency and authorization tests pass |
| 0.4 Real intelligence | AI gateway, context retrieval, source labels | Evaluation set passes; provider keys never exposed client-side |
| 0.5 Personal system | Nine worlds, goals, decisions, experiments | End-to-end user workflows pass |
| 0.6 Voice | Explicit recording, transcription, spoken output | Consent, retention, and deletion tests pass |
| 0.8 Hardening | Security, backups, monitoring, accessibility | Security review and restore drill pass |
| 1.0 Release | Coherent daily-use product | All P0 acceptance criteria pass |

Version numbers are planning labels, not estimates of calendar duration.

## 15. Quality and acceptance framework

A feature is not “done” because it renders. It is done when it works end-to-end and has tests.

Required test suites:

- Unit tests for domain rules and validation.
- Integration tests for APIs, storage, and model adapters.
- End-to-end tests for onboarding, profile, memory, actions, and export/import.
- Authorization tests for every data category and connector.
- Migration tests from every supported prior schema.
- AI evaluations for factuality, citation correctness, uncertainty calibration, privacy leakage, instruction following, and usefulness.
- Accessibility checks for keyboard, contrast, labels, focus, and screen readers.
- Performance checks on common mobile devices and slower networks.
- Backup/restore drills and deletion verification.

Core product metrics should measure successful task completion, retrieval accuracy, answer quality, user correction rates, action follow-through where voluntarily tracked, reliability, and user trust. Avoid optimizing for time spent in the app or number of messages.

## 16. GENESIS REVIEW — current prototype audit

The current FOUNDATION 0.1 is a local HTML prototype. It has a coherent visual direction and basic local interactions, but it is not yet a production application.

### Strengths

- Distinct product identity and restrained dark/gold visual language.
- Clear starting spaces: Command, Worlds, Actions, Memory, Oracle, Personal Model, Settings.
- Explicit disclosure that AI and cloud functions are not connected.
- Local export/import and user-controlled data entry.

### Weaknesses to address

- Local browser storage is fragile, unencrypted by the app, and not synchronized.
- No account, backend, access control, or server-side authorization.
- Oracle only prepares context; it is not a live AI integration.
- World scores alone are shallow and risk implying false precision.
- Actions are tasks, not yet full goals/projects/dependencies.
- Memory has limited metadata and no semantic retrieval.
- No robust tests, monitoring, or recovery service.
- Single HTML file will become difficult to maintain as the product grows.

### Improvements introduced in FOUNDATION 0.2

- Versioned data normalization and safer import validation.
- Export format with application/version metadata.
- Search for actions and memory.
- Edit and delete flows for records.
- Completion timestamps for actions.
- Structured per-world intention, focus, next step, and assessment history.
- Context export includes world context and labels user-entered records as unverified.
- Storage errors are surfaced rather than silently treated as success.
- Reduced-motion support and improved control labels.

This is a usability and data-integrity improvement, not a backend or security upgrade. The app remains local-first and must not be used as a sensitive-data vault.

## 17. Immediate engineering priorities

1. Freeze and test the 0.2 data schema; write migration tests from 0.1.
2. Split the monolithic HTML into maintainable application modules when moving to the real app stack.
3. Define canonical API and database contracts before building more screens.
4. Implement authentication, authorization, encryption, and backups before sensitive integrations.
5. Build AI gateway and context retrieval as a secure server-side service.
6. Add evaluation datasets before expanding agent roles.
7. Build one complete end-to-end workflow before adding more modules: capture a thought → approve memory → connect it to a world/goal → create an action → review outcome.

## 18. Definition of success

GENESIS 1.0 succeeds when a person can use it regularly to understand relevant context, retrieve trusted personal knowledge, reason through decisions, create and manage meaningful goals, take actions, and learn from outcomes — with control over their data and without surrendering authorship of their life.

**Final principle:** Build the smallest complete system that delivers the full loop. Keep the long-term vision expansive; keep every release honest, testable, secure, and useful.
