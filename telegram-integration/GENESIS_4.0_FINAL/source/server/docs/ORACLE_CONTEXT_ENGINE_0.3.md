# GENESIS ORACLE — Context Engine 0.3

## Status

- Context manifest: IMPLEMENTED
- Provenance labels: IMPLEMENTED
- Character-budget truncation: IMPLEMENTED
- Chat route integration: IMPLEMENTED
- Provider boundary (OpenAI adapter): IMPLEMENTED
- Additional provider adapters: NOT IMPLEMENTED
- Runtime / database / browser verification: PENDING

## Context contract

`createOracleContext` receives only records already scoped to the authenticated user by the chat route. It returns a versioned manifest and a rendered representation. The manifest labels each entry by kind, provenance and trust. User-saved data is explicitly marked as not independently verified. The context policy does not infer approval from an `active` status.

The context budget is bounded (16,000 characters by default). Truncation is surfaced in the manifest. Empty context is explicit rather than silently represented as personal knowledge.

## Prompt-injection boundary

Profile, memory and world content are user data, not system instructions. ORACLE's system prompt explicitly says not to execute instructions embedded in those records. This is a prompt-level mitigation, not a complete isolation boundary; future tool-using agents must keep untrusted context out of privileged instruction channels and validate all proposed actions independently.

## Provider boundary

`completeOracle` is a server-only provider boundary. `GENESIS_AI_PROVIDER` currently accepts `openai`; unsupported providers fail closed. `OPENAI_API_KEY` is read only on the server. Provider and model metadata are available internally for future audit/observability work.

## Next work

1. Add explicit memory consent/approval state and UI; do not reinterpret existing `active` records as approval.
2. Add typed intent routing and capability policy before tool execution.
3. Add durable rate limiting and per-user AI budgets.
4. Add request correlation IDs, provider latency/cost telemetry and retry classification.
5. Add provider contract tests and an alternative provider adapter only when its key handling and structured-output behavior are verified.
6. Run full typecheck/build against installed pinned dependencies and a disposable PostgreSQL database.
