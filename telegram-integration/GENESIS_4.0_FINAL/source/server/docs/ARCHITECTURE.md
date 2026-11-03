# GENESIS 1.0 architecture

## Product boundary

A private personal intelligence application built as a modular monolith. The modular monolith is intentional for 1.0: one deployable server application, one canonical PostgreSQL data layer, and clear module boundaries. Split services only when operational evidence justifies the cost.

## Runtime

- Next.js App Router / TypeScript: responsive experience and server API.
- PostgreSQL: canonical user, profile, world, action, memory, conversation and audit records.
- pgvector: semantic retrieval of user-approved memory records.
- Prisma: schema, migrations and typed data access; raw SQL only for vector operations.
- OpenAI API: server-side model and embedding adapter.
- Signed HttpOnly cookie: session boundary.

## Request path

1. Browser calls a server route.
2. Route verifies signed session.
3. Route resolves the user and scopes every read/write to that user ID.
4. Context assembler selects only the profile, active memory, world intentions and recent dialogue needed for the task.
5. ORACLE sends the bounded context to the model provider from the server.
6. Conversation turns are stored with user ownership.
7. Audit records capture selected important events without logging prompts or secrets.

## Knowledge semantics

Memory classifications currently supported: USER_STATEMENT, SELF_ASSESSMENT, OBSERVATION, HYPOTHESIS. AI interpretations are not automatically promoted into memory. Profile versions preserve the previous user-authored snapshot on edit.

## Security boundary

The current package is a private beta foundation, not a completed security certification. Authentication, password hashing, HttpOnly cookies, ownership-scoped data access, secret separation and account deletion exist in source. Durable rate limiting, MFA, invitation-only onboarding, managed backups, monitoring, recovery drills and formal threat-model testing remain release gates.
