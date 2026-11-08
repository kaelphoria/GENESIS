const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'prisma/migrations/202611030008_artifact_lifecycle/migration.sql'), 'utf8');
const route = fs.readFileSync(path.join(root, 'app/api/artifacts/route.ts'), 'utf8');

test('artifact model has project/source relations, lifecycle state and version metadata', () => {
  assert.match(schema.replace(/\s+/g, ' '), /model Artifact[\s\S]*?sourceId String\?[\s\S]*?status String @default\("active"\)[\s\S]*?version Int @default\(1\)/);
  assert.match(schema.replace(/\s+/g, ' '), /source Source\?/);
});

test('artifact lifecycle migration is additive', () => {
  assert.match(migration, /ADD COLUMN "sourceId" TEXT/);
  assert.match(migration, /ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active'/);
  assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM|TRUNCATE/i);
});

test('artifact API checks project and source ownership and writes provenance', () => {
  assert.match(route.replace(/\s+/g, ' '), /requireSameOrigin/);
  assert.match(route.replace(/\s+/g, ' '), /db\.project\.findFirst\(\{ where: \{ id: parsed\.data\.projectId, userId: user\.id/);
  assert.match(route.replace(/\s+/g, ' '), /db\.source\.findFirst\(\{ where: \{ id: parsed\.data\.sourceId, userId: user\.id/);
  assert.match(route.replace(/\s+/g, ' '), /ARTIFACT_REGISTERED/);
  assert.match(route.replace(/\s+/g, ' '), /ARTIFACT_ARCHIVED/);
});

test('artifact metadata registration does not pretend file bytes or hashes were stored', () => {
  assert.match(route.replace(/\s+/g, ' '), /storageUri: null, contentHash: null/);
  assert.match(route.replace(/\s+/g, ' '), /contentBytesStored: false/);
  assert.doesNotMatch(route, /fetch\(|request\.formData\(|writeFile/);
});

test('project workspace registers artifact metadata, links sources and exposes provenance history', () => {
  const workspace = fs.readFileSync(path.join(root, 'components/ExecutionWorkspace.tsx'), 'utf8');
  assert.match(workspace, /request\('\/api\/artifacts', 'POST'/);
  assert.match(workspace, /sourceId: artifactForm\.sourceId/);
  assert.match(workspace, /request\(`\/api\/artifacts\?id=/);
  assert.match(workspace, /artifactDetail\.provenanceEvents/);
  assert.match(workspace, /archiveArtifact/);
});
