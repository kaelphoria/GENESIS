# GENESIS 5.0 — Recovery & Verification Report

Дата: 4 ноября 2026  
Статус: **RECOVERED / BUILD VERIFIED / PREVIEW-READY — НЕ PRODUCTION RELEASE**

## 1. Восстановленная исходная база

- Источник: GENESIS_5.0_RECOVERY.zip из ветки genesis-5-recovery.
- Размер исходного архива: 960 606 байт.
- SHA-1 исходного архива: d6e835cb85f3dd9de2011154bd2e67cdfbac9d3f.
- ZIP integrity: unzip -t — ошибок нет.
- Архив распакован в изолированную рабочую среду и сопоставлен с восстановленной копией. Содержимое совпадает; .env.example сохранён отдельно в рабочем дереве.
- Работа ведётся в отдельной sandbox-ветке genesis/5.0-integration.
- GitHub main не изменялся. Production deployment не выполнялся.

## 2. Что входит в восстановленную систему

- Local-first PWA: основной интерфейс, локальное хранилище, Service Worker, manifest и offline assets.
- Server app: Next.js 15 / React 19, регистрация и вход, owner-scoped API, Prisma/PostgreSQL.
- ORACLE: provider boundary, OpenAI и явный Ollama adapter, контекст и provenance, bounded specialist orchestration, trace и cost ledger.
- Personal Memory: явное разрешение контекста, версии, источники и provenance.
- Projects, Goals, Milestones, Decision Lab и Life Timeline.
- Import preview, одноразовые receipt, export, backup envelope и artifact quarantine.
- Telegram Mini App, Telegram auth и webhook endpoints.
- Future Interface styles and Manual ORACLE workflow.

Наличие исходников не означает, что внешние сервисы уже подключены или проверены в production.

## 3. Верификация

| Проверка | Результат |
|---|---:|
| Исходный архив ZIP | PASS |
| TypeScript tsc --noEmit | PASS |
| Prisma schema validation | PASS |
| Server tests | 162 / 162 PASS |
| PWA contract tests | 8 / 8 PASS |
| node --check storage.js | PASS |
| node --check sw.js | PASS |
| Next.js production build | PASS |

Prisma validation выполнена с временным тестовым DATABASE_URL; подключение к реальной базе данных этим не подтверждается.

Contract tests приведены к whitespace-insensitive проверкам, чтобы проверять структуру/контракт, а не конкретное форматирование исходников. Дополнительно исправлен тест повреждения backup ciphertext: тест теперь гарантированно меняет байт, а не иногда оставляет исходное значение неизменным. Поведение приложения этими тестовыми правками не подменялось.

## 4. Известные ограничения и release gates

1. Database: реальное подключение, применение миграций и интеграционные тесты на отдельной PostgreSQL базе ещё не выполнены.
2. Secrets: production secrets и bootstrap token не включены в архив. Их нужно задать в защищённых переменных среды; .env и реальные секреты в ZIP не помещаются.
3. Telegram: webhook и Mini App endpoints присутствуют, но живой Telegram bot token, webhook registration и end-to-end Telegram login не проверялись.
4. AI providers: OpenAI/Ollama adapters проверены контрактно; реальные provider credentials и live calls не тестировались.
5. Security audit: npm audit показывает 3 high vulnerabilities в цепочке Prisma 6 (prisma, @prisma/config, deepmerge-ts). Автоматическое исправление предлагает major upgrade на Prisma 7. Оно отложено, чтобы не вносить несовместимую миграцию без отдельной проверки.
6. Deployment: production не развёрнут и не изменён. Текущая проверка — локальная сборка в sandbox.

## 5. Следующий безопасный этап

- Поднять отдельную staging PostgreSQL базу и проверить миграции.
- Заполнить production/staging secrets в Vercel без передачи их в чат или Git.
- Проверить регистрацию, логин, ручной ORACLE, память, экспорт/импорт и Telegram Mini App в staging.
- Отдельно оценить Prisma 7 migration и обновить lockfile после тестирования.
- После прохождения release gates создать preview deployment и провести browser / mobile QA.
- Только после явного подтверждения владельца — выпускать production.

## 6. Безопасность и сохранность

- Не добавлять .env, API keys, Telegram bot token, database passwords или bootstrap token в ZIP/Git.
- Не выполнять миграции на production при проверке.
- Не изменять main и не назначать production aliases в ходе recovery.
