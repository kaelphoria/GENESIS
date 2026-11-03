const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'prisma/migrations/202611030007_memory_provenance/migration.sql'), 'utf8');
const memoryRoute = fs.readFileSync(path.join(root, 'app/api/memories/route.ts'), 'utf8');
const sourceRoute = fs.readFileSync(path.join(root, 'app/api/sources/route.ts'), 'utf8');
const exportRoute = fs.readFileSync(path.join(root, 'app/api/export/route.ts'), 'utf8');

test('memory provenance schema tracks source references, versions and immutable event history', () => {
  assert.match(schema, /model Source \{/);
  assert.match(schema, /model MemoryVersion \{/);
  assert.match(schema, /model ProvenanceEvent \{/);
  assert.match(schema, /sourceRef Source\?/);
  assert.match(schema, /@@unique\(\[memoryId, version\]\)/);
});

test('provenance migration is additive and leaves existing memories intact', () => {
  assert.match(migration, /ADD COLUMN "sourceRefId" TEXT/);
  assert.match(migration, /ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1/);
  assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM "MemoryRecord"|TRUNCATE/i);
  assert.match(migration, /INSERT INTO "MemoryVersion"[\s\S]*?FROM "MemoryRecord"/);
  assert.match(migration, /LEGACY_MEMORY_BASELINE/);
});

test('memory creation writes version one and a provenance event transactionally', () => {
  assert.match(memoryRoute, /tx\.memoryVersion\.create/);
  assert.match(memoryRoute, /version: 1, snapshot: memorySnapshot\(created\)/);
  assert.match(memoryRoute, /tx\.provenanceEvent\.create/);
});

test('memory edits use optimistic concurrency and preserve a version snapshot', () => {
  assert.match(memoryRoute, /version: existing\.version/);
  assert.match(memoryRoute, /version: \{ increment: 1 \}/);
  assert.match(memoryRoute, /memoryVersion\.create/);
  assert.match(memoryRoute, /параллельно/);
});

test('source references are checked against the current user before attaching to memory', () => {
  assert.match(memoryRoute, /db\.source\.findFirst\(\{ where: \{ id: parsed\.data\.sourceRefId, userId: user\.id/);
  assert.match(memoryRoute, /db\.source\.findFirst\(\{ where: \{ id: data\.sourceRefId, userId: user\.id/);
});

test('source registry marks all newly registered sources unverified and never fetches their URLs', () => {
  assert.match(sourceRoute, /trustStatus: 'unverified'/);
  assert.match(sourceRoute, /SOURCE_REGISTERED/);
  assert.doesNotMatch(sourceRoute, /fetch\(|axios|http\.get/);
});

test('versioned account export includes sources, memory versions and provenance events', () => {
  for (const field of ['sources', 'memoryVersions', 'provenanceEvents']) assert.match(exportRoute, new RegExp(field));
});

test('canonical dashboard exposes source trust labels and version history to the record owner', () => {
  const dashboard = fs.readFileSync(path.join(root, 'components/Dashboard.tsx'), 'utf8');
  const meRoute = fs.readFileSync(path.join(root, 'app/api/me/route.ts'), 'utf8');
  assert.match(meRoute, /sourceRef:\{select:\{id:true,title:true,kind:true,trustStatus:true\}\}/);
  assert.match(dashboard, /ИСТОРИЯ ВЕРСИЙ \/ ПРОИСХОЖДЕНИЕ/);
  assert.match(dashboard, /m\.sourceRef\.trustStatus/);
});

test('memory workspace lets the user register an unverified source and attach it to a new record', () => {
  const dashboard = fs.readFileSync(path.join(root, 'components/Dashboard.tsx'), 'utf8');
  const meRoute = fs.readFileSync(path.join(root, 'app/api/me/route.ts'), 'utf8');
  assert.match(dashboard, /Добавить источник/);
  assert.match(dashboard, /api\('\/api\/sources','POST'/);
  assert.match(dashboard, /sourceRefId:form\.sourceRefId\|\|null/);
  assert.match(meRoute, /sources,goals\}\);/);
});

test('source registration does not trust client-supplied content hashes', () => {
  const validators = fs.readFileSync(path.join(root, 'lib/validators.ts'), 'utf8');
  const sourceSchemaBlock = validators.split('export const sourceSchema')[1].split('export const artifactSchema')[0];
  assert.doesNotMatch(sourceSchemaBlock, /contentHash/);
});
