# GENESIS ORACLE — Specialist Orchestration 0.1

## Status

**INTEGRATED / CONTRACT-TESTED.** Runtime and database integration remain unverified until dependencies and PostgreSQL are available.

## Design

ORACLE uses deterministic intent routing to select a bounded sequence of internal specialist stages. The system remains a modular monolith; agents are not separate services and do not have independent credentials or direct tool access.

| Intent | Specialist sequence | Maximum calls |
|---|---|---:|
| Decision | Decision analyst → critical reviewer | 2 |
| Planning | Planning strategist → feasibility reviewer | 2 |
| Execution request | Implementation planner → safety reviewer | 2 |
| Creation | Creative studio | 1 |
| Research | Research synthesizer | 1 |
| Reflection | Reflective guide | 1 |
| Conversation / unknown | Generalist | 1 |

## Contracts and governance

- Every stage receives a declared purpose, allowed capability IDs and shared human-control / epistemic-integrity boundaries.
- Only `oracle.respond` and, when explicitly enabled, `memory.read` are passed as allowed capabilities.
- No agent can access external tools, send messages, alter records, deploy code or execute tasks.
- The research specialist must disclose that external research was not performed when web access is unavailable.
- Each output is validated for type, non-empty content and maximum length before it can be passed to another stage.
- Current output budget: at most 900 completion tokens per stage and 1,800 completion tokens across a two-stage request. This is a token ceiling, not a monetary cost estimate.

## Durable execution and recovery

- Each successful specialist output is checkpointed in `ChatRequest.agentTrace` before the next stage begins.
- Failed requests resume from the last durably completed stage, avoiding repeated calls for successful stages.
- Public trace metadata exposes the trace ID, specialist IDs, call count and output-token ceiling; intermediate specialist drafts remain in the private request record.
- Request records are included in the user's data export and are deleted through the user's existing cascading account deletion.
- The additive schema change is migration `202611030005_agent_trace`; prior migrations remain immutable.

## Limitations

- This is sequential in-process orchestration, not a distributed multi-agent runtime.
- Specialist routing is deterministic and depends on the first-pass heuristic intent classifier.
- There is no independent agent credentialing, external tool execution, parallel fan-out, live cancellation, or persisted monetary cost accounting yet.
- Runtime validation against Prisma/PostgreSQL and end-to-end browser tests are still required.
