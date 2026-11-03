# GENESIS 4.0 — handoff

Сборка: 2026-11-03. Базовый архив 3.1 сохранён отдельно и не изменён.

## Структура
- `pwa/` — основная Universe 4.0 local-first PWA.
- `iphone/` — iPhone-совместимый дубль PWA.
- `server/` — серверное ядро и API.
- `GENESIS_MASTER_ARCHITECTURE_2.0.md` — исходная мастер-архитектура.
- `GENESIS_4.0_RELEASE_NOTES_RU.md` — состав и ограничения.
- `VERIFICATION_4.0.txt` — фактические результаты проверок.

## Ключевые изменения этого выпуска
1. Версия PWA поднята до 4.0.0-private-preview; обновлён app shell cache.
2. Добавлен Cognitive Decision Lab: варианты, критерии, веса 1–5, оценка 1–5, взвешенное ранжирование и пояснение границ метода.
3. Навигация Universe получила раздел Simulation.
4. Обновлены manifest, iPhone shell и release docs.

## Важное
PWA↔server sync не реализован. Не считать включёнными функции, которые требуют внешнего AI, PostgreSQL, облачной инфраструктуры, iOS E2E или deployment. См. release notes.
