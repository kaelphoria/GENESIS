# GENESIS 5.0 — Telegram release checkpoint

## Source integration added
- Private Telegram webhook adapter and command handling.
- Telegram Mini App launch page.
- Server-side initData HMAC validation and freshness check.
- Strict Telegram user allowlist and fixed owner mapping.
- HttpOnly GENESIS session issuance.
- Webhook secret validation and setup guide.

## Remaining before live operation
1. Deploy Next.js server to HTTPS host with PostgreSQL + pgvector.
2. Configure GENESIS secrets and AI provider.
3. Create bot with BotFather and store token in encrypted host settings.
4. Configure numeric Telegram user ID and existing GENESIS owner database ID.
5. Register webhook and test `/start`, Mini App login, session persistence and ORACLE.
6. Run full typecheck/build, database migrations and iOS Telegram E2E.

No live bot or public Mini App is claimed. Token, account ID, domain, database deployment and owner DB ID are external prerequisites not present in the project.
