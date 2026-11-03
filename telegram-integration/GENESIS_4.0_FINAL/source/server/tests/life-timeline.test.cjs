const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'prisma/migrations/202611030009_life_timeline/migration.sql'), 'utf8');
const route = fs.readFileSync(path.join(root, 'app/api/life-events/route.ts'), 'utf8');
const exportRoute = fs.readFileSync(path.join(root, 'app/api/export/route.ts'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'components/Dashboard.tsx'), 'utf8');
const workspace = fs.readFileSync(path.join(root, 'components/LifeTimeline.tsx'), 'utf8');

test('LifeEvent model is user-owned and links optional project, decision and source context', () => {
  assert.match(schema, /model LifeEvent \{[\s\S]*?user User @relation\(fields: \[userId\], references: \[id\], onDelete: Cascade\)/);
  assert.match(schema, /project Project\? @relation\(fields: \[projectId\], references: \[id\], onDelete: SetNull\)/);
  assert.match(schema, /decision Decision\? @relation\(fields: \[decisionId\], references: \[id\], onDelete: SetNull\)/);
  assert.match(schema, /source Source\? @relation\(fields: \[sourceId\], references: \[id\], onDelete: SetNull\)/);
});

test('Life Timeline migration is additive and indexed by owner/date/category', () => {
  assert.match(migration, /CREATE TABLE "LifeEvent"/);
  assert.match(migration, /LifeEvent_userId_occurredAt_idx/);
  assert.match(migration, /ON DELETE CASCADE/);
  assert.match(migration, /ON DELETE SET NULL/);
  assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM|TRUNCATE/i);
});

test('Life Event API enforces authentication, same-origin writes and ownership for linked records', () => {
  assert.match(route, /requireSameOrigin/);
  assert.match(route, /apiUser/);
  assert.match(route, /where: \{ id: links\.projectId, userId \}/);
  assert.match(route, /where: \{ id: links\.decisionId, userId \}/);
  assert.match(route, /where: \{ id: links\.sourceId, userId \}/);
  assert.match(route, /where: \{ userId: user\.id \}, orderBy: \[\{ occurredAt: 'desc' \}/);
});

test('Life Event updates use optimistic version checks and deletes are owner-scoped', () => {
  assert.match(route, /body\.version !== existing\.version/);
  assert.match(route, /version: \{ increment: 1 \}/);
  assert.match(route, /where: \{ id, userId: user\.id \}/);
});

test('Versioned account export includes Life Timeline records in schema version 6', () => {
  assert.match(exportRoute, /schemaVersion:6/);
  assert.match(exportRoute, /db\.lifeEvent\.findMany/);
  assert.match(exportRoute, /lifeEventVersions\},null,2/);
});

test('Dashboard exposes the Life Timeline and links it to project, decision and source registries', () => {
  assert.match(dashboard, /LIFE TIMELINE/);
  assert.match(dashboard, /tab==='timeline'&&<LifeTimeline\/>/);
  assert.match(workspace, /request\('\/api\/life-events'/);
  assert.match(workspace, /request\('\/api\/projects'/);
  assert.match(workspace, /request\('\/api\/decisions'/);
  assert.match(workspace, /request\('\/api\/sources'/);
});

test('LifeEventVersion stores immutable JSON snapshots with per-event version uniqueness', () => {
  assert.match(schema, /model LifeEventVersion \{[\s\S]*?snapshot Json[\s\S]*?@@unique\(\[eventId, version\]\)/);
  const versionMigration = fs.readFileSync(path.join(root, 'prisma/migrations/202611030010_life_event_versions/migration.sql'), 'utf8');
  assert.match(versionMigration, /CREATE TABLE "LifeEventVersion"/);
  assert.match(versionMigration, /INSERT INTO "LifeEventVersion"[\s\S]*?FROM "LifeEvent"/);
  assert.doesNotMatch(versionMigration, /DROP TABLE|DELETE FROM|TRUNCATE/i);
});

test('Life Event API snapshots every create/update and exposes owner-scoped version history', () => {
  assert.match(route, /include: \{ versions: \{ orderBy: \{ version: 'desc' \}/);
  assert.match(route, /tx\.lifeEventVersion\.create/);
  assert.match(route, /version: updated\.version/);
  assert.match(route, /snapshot: \{ title: updated\.title/);
});

test('Life Timeline UI supports editing and displays prior snapshots', () => {
  assert.match(workspace, /Редактировать \/ история версий/);
  assert.match(workspace, /Сохранить новую версию/);
  assert.match(workspace, /История изменений/);
  assert.match(workspace, /version\.snapshot\.title/);
});
