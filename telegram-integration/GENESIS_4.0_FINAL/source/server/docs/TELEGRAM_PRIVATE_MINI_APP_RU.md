# GENESIS Telegram Integration — private single-owner setup

## Implemented
- `POST /api/telegram/webhook`: webhook protected by Telegram `X-Telegram-Bot-Api-Secret-Token`.
- `/start`, `/open`, `/help` commands with a Mini App launch button.
- `/telegram`: Mini App shell using the official Telegram Web App SDK.
- `POST /api/telegram/auth`: server-side HMAC verification of Telegram `initData`, 5-minute freshness window, exact Telegram user allowlist, then issues the existing HttpOnly GENESIS session for the configured owner.
- No account auto-registration and no client-trusted Telegram user ID.

## Required encrypted environment variables
- `TELEGRAM_BOT_TOKEN`: BotFather token.
- `TELEGRAM_WEBHOOK_SECRET`: long random webhook secret.
- `TELEGRAM_WEBAPP_URL`: public HTTPS URL ending `/telegram`.
- `GENESIS_TELEGRAM_ALLOWED_USER_ID`: your numeric Telegram user ID.
- `GENESIS_TELEGRAM_OWNER_USER_ID`: exact existing owner `User.id` in PostgreSQL.

Keep secrets in the hosting provider's encrypted settings, never in source or chat.

## Register webhook
After deployment, call Telegram Bot API `setWebhook` with:
`{"url":"https://YOUR_DOMAIN/api/telegram/webhook","secret_token":"YOUR_WEBHOOK_SECRET","allowed_updates":["message"]}`

Set commands with BotFather `/setcommands`:
`start - Open GENESIS`
`open - Open GENESIS Mini App`
`help - Help`

## Boundaries
- Private, single-owner configuration only.
- Bot is the secure launcher and command surface. Full ORACLE conversation is currently inside Mini App, not directly in Telegram chat.
- Requires HTTPS, deployed Next.js server, PostgreSQL/pgvector, existing GENESIS owner account, AUTH_SECRET and configured AI provider.
- Source integration does not create the bot, hosting account, database, domain or deployment.
