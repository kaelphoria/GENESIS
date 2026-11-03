# GENESIS 4.1 Recovery — аудит и восстановление перед 5.0

Дата: 2026-11-03  
Статус: RECOVERY WORKSPACE / НЕ RELEASE  
Целевая версия продукта: GENESIS 5.0  

## 1. Решение по исходной базе

- GENESIS 3.1 остаётся подтверждённым предшественником и контрольной точкой.
- GENESIS 4.0 подтверждён как реальная следующая продуктовая сборка: добавлены Cognitive Decision Lab / Simulation, обновлены PWA shell, manifest и service worker, добавлены release-документы и тест Decision Lab.
- В серверной части 4.0 не обнаружено новых изменений относительно 3.1: серверные исходники, Prisma schema, миграции, cost ledger, import receipt ledger и server tests совпадают побайтно.
- `GENESIS_4.0_FINAL_COMPLETE.zip` — наиболее удобная основа для recovery workspace: в нём отдельно лежат `site/` и `source/server/`.
- Оригинальные архивы 3.1 и 4.0 не изменялись.

## 2. Сверка архивов

Проверены ZIP CRC:
- `GENESIS_3.1_INTEGRATION_LEAP_PRIVATE.zip`: 240 entries, CRC OK.
- `GENESIS_4.0_PRIVATE_PREVIEW.zip`: 245 entries, CRC OK.
- `GENESIS_4.0_FINAL_COMPLETE.zip`: 230 entries, CRC OK.
- `GENESIS_4.0_IPHONE_UPLOAD.zip`: 9 entries, CRC OK.
- `GENESIS_4.0_UNIVERSE_PWA_IPHONE.zip`: 21 entries, CRC OK.
- `GENESIS_4.0_CLOUDFLARE_UPLOAD.zip`: 11 entries, CRC OK.

Сравнение содержимого `3.1` и `4.0 PRIVATE_PREVIEW`:
- 182 общих файла.
- 176 общих файлов идентичны.
- 6 общих файлов изменены: `iphone/index.html`, `iphone/manifest.webmanifest`, `iphone/sw.js`, `pwa/index.html`, `pwa/sw.js`, `server/tests/iphone-storage-contract.test.cjs`.
- 5 файлов добавлено: release/handoff/verification docs и тест Decision Lab.
- Все общие серверные файлы, включая `server/prisma/schema.prisma`, миграции, `server/lib/oracle/cost-ledger.mjs`, API и серверные тесты, совпадают с 3.1.

Сравнение `4.0 PRIVATE_PREVIEW` и `4.0 FINAL_COMPLETE` после нормализации путей:
- 158 общих файлов совпадают побайтно.
- Различия в основном структурные: `pwa/iphone` в preview преобразованы в `site/` и iPhone upload package в final.
- Поэтому эти архивы — две упаковки одной кодовой линии 4.0, а не два самостоятельных серверных релиза.

## 3. Исправление упаковки в recovery-копии

В `FINAL_COMPLETE` серверные тесты ссылаются на `source/iphone/sw.js`, но архив содержит `site/sw.js`. Из-за этого прямой `npm test` в распакованном final package давал 148 PASS / 4 FAIL (ENOENT по ожидаемому пути).

В recovery workspace создана совместимая копия `source/iphone/` из `site/`. Оригинальный архив не менялся. После этого:
- Server tests: 160/160 PASS.
- PWA ORACLE + Decision Lab contract tests: 8/8 PASS.
- Итого повторно воспроизводимый набор: 168/168 PASS.
- `node --check site/storage.js`: PASS.
- `node --check site/sw.js`: PASS.
- Inline JavaScript `site/index.html`: parse PASS.

Это исправление структуры тестового workspace, не доказательство production readiness.

## 4. Ledger: фактический статус

В 4.0 уже присутствуют два разных ledger-потока:

1. **Import Preview Receipt Ledger** — модель `ImportPreviewReceipt`, миграция `202611030012_import_receipt_ledger`, одноразовый nonce, привязка к владельцу, hash payload, schema version, expiry и consumedAt. Серверные contract/unit tests проходят. Реальная миграция и конкурентное consume на PostgreSQL не проверялись.
2. **ORACLE usage/cost ledger** — `lib/oracle/cost-ledger.mjs` рассчитывает стоимость по фактическим token usage и явно заданному датированному каталогу тарифов. При отсутствии точного совпадения цена остаётся `null`, а не выдумывается. Это расчёт/учёт стоимости в trace, не отдельный финансовый журнал транзакций с гарантированной append-only персистентностью.

Не объединять эти два понятия в одну сущность. Для 5.0 нужен единый доменный контракт Ledger с отдельными типами событий, provenance, idempotency, lifecycle и экспортом; при этом сохраняется совместимость существующих receipt и usage данных.

## 5. Release blockers 4.0, подтверждённые исходниками и статус-документами

- Нет lockfile; dependency tree не воспроизводим.
- Не выполнены `npm ci`, Next.js typecheck/build, Prisma validate/generate.
- Не применялись все миграции на disposable PostgreSQL + pgvector.
- Не проверены транзакции/конкурентность bootstrap, import receipt consume, ownership и migration backfill на реальной БД.
- Не выполнен browser E2E / iPhone Safari install-and-use / update lifecycle.
- Нет подтверждённого backup restore drill.
- Нет подтверждённого production deployment, provider configuration и live ORACLE request.
- PWA остаётся local-first; PWA↔server sync и multi-device merge не реализованы.
- Browser data at rest не зашифрованы; AES-GCM защищает экспортируемый backup.
- В 4.0 final archive обнаружено несоответствие тестового пути `source/iphone` и фактической папки `site`; исправлено только в этой recovery-копии.

## 6. Статус Client Hardening 4.0

В текущем доступном наборе нет исходного патча/архива Client Hardening 4.0, содержащего исправления по JCS, IndexedDB migration, outbox и другим пунктам. Из handoff второго рабочего чата известен статус PARTIAL и список открытых дефектов:
- JCS vectors / canonical validation;
- IndexedDB schema/index migration;
- safe import validation;
- cycles/branches;
- stuck SENDING recovery;
- repeatable diagnostics;
- HTML escaping.

Эти пункты остаются OPEN / NOT REPRODUCED в настоящем workspace: нельзя заявить, что они исправлены или присутствуют в 4.0, пока не найден соответствующий исходник и не проведены адресные тесты. Отдельно проверить ACK outbox только после серверного подтверждения и duplicate idempotency key semantics.

## 7. GENESIS 5.0 architecture bridge

Сохраняем целевой восьмислойный контур, восстановленный из решений рабочего чата:
1. Experience Layer — iPhone PWA / Web / Telegram Mini App как интерфейсы, без владения доменными данными.
2. Personal Context Layer — Context Engine, Personal Model, explicit context permissions.
3. Intelligence Core — ORACLE, Cognitive Router, model/provider adapters, bounded orchestration.
4. Knowledge Fabric — сущности, связи, источники, проекты, решения, provenance.
5. Memory Layer — working, episodic, semantic, project, procedural memory.
6. Execution Layer — планы, задачи, действия, инструменты; каждое внешнее действие с явным разрешением.
7. Trust & Security Layer — identity, access control, audit, consent, privacy, export/restore.
8. Evolution Layer — Life Timeline, reflection, Decision Lab, evaluations, controlled adaptation.

Обязательные модули: Context Engine, Timeline, Personal Model, Cognitive Router, Decision Lab, Nine Worlds, ORACLE. Nine Worlds остаются девятью пользовательскими пространствами, а не девятью независимыми приложениями.

Архитектурные инварианты:
- Server = canonical authority для синхронизированных записей, auth, permissions и AI gateway.
- iPhone PWA = local-first client; локальные данные не перезаписываются молча.
- Один модульный монолит и единый доменный контракт; без преждевременных микросервисов.
- Sync только explicit, idempotent, conflict-aware и non-destructive.
- Один серверный AI gateway; provider API keys не попадают в PWA.
- Память хранит provenance, source, version, supersession и отдельное разрешение на использование контекста.
- AI expands. Human decides. Human remains the author.

## 8. Путь выпуска 4.1 → 5.0

- 4.1 Recovery — инвентаризация, подтверждение канонической базы, воспроизводимая сборка, восстановление тестовой структуры, аудит данных/миграций и сохранение локальных данных.
- 4.2 Unified Domain — общие типы, ID, schema versions, validators, event contracts и адаптеры PWA/server.
- 4.3 Local-first — IndexedDB schema migration, encrypted backup/restore, outbox, idempotency и безопасное восстановление после offline/retry.
- 4.4 ORACLE — единый контекстный контракт, Context Inspector, conversation continuity и provider-neutral gateway.
- 4.5 Sync — explicit opt-in sync, server receipts, conflict resolution, tombstones и no silent overwrite.
- 4.6 Trust/Security — consent, permissions, audit, origin/session hardening, rate limits, retention, restore drills.
- 4.7 Decision Lab — единый Decision domain, criteria/weights, provenance и связи с goals/projects/timeline.
- 4.8 Agents — bounded, observable, approval-gated tools; no autonomous external write by default.
- 4.9 Evolution — evaluation, reflection, user-controlled model evolution.
- 5.0 Unified Intelligence — интеграция слоёв в один продукт после прохождения release gates.

## 9. Что нужно до объявления 5.0 готовым

P0:
- Получить/восстановить точный `MASTER ARCHITECTURE 5.0` как документ; этот файл не найден в доступных архивах, поэтому данный bridge не заменяет его.
- Найти исходники Client Hardening 4.0 и закрыть перечисленные дефекты тестами.
- Утвердить canonical source layout и не дублировать PWA без проверяемого build step.
- Зафиксировать domain contract и migration compatibility 3.1/4.0 → 5.0.
- Сохранить/проверить пользовательские локальные данные до любых schema migrations.

P1:
- Lockfile + clean install + typecheck + production build.
- Prisma validate/generate + все миграции на disposable PostgreSQL/pgvector.
- Integration tests для auth/ownership/idempotency/receipt ledger/memory provenance.
- Browser E2E и реальный iPhone Safari smoke test.
- Backup export/import round-trip и restore drill.
- Security review и deployment preflight.

До выполнения P0/P1 статус GENESIS 5.0 — IN DEVELOPMENT, не RELEASE.
