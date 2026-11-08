const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'prisma/migrations/202611030006_execution_domain/migration.sql'), 'utf8');
const exportRoute = fs.readFileSync(path.join(root, 'app/api/export/route.ts'), 'utf8');

test('execution and decision domain models are owned by the user and connected by explicit relations', () => {
  for (const model of ['Project', 'Milestone', 'Decision', 'Experiment', 'Artifact']) assert.match(schema.replace(/\s+/g, ' '), new RegExp(`model ${model} \\{`));
  assert.match(schema.replace(/\s+/g, ' '), /model Project[\s\S]*?user User @relation/);
  assert.match(schema.replace(/\s+/g, ' '), /model Milestone[\s\S]*?project Project @relation/);
  assert.match(schema.replace(/\s+/g, ' '), /model Decision[\s\S]*?experiments Experiment\[\]/);
  assert.match(schema.replace(/\s+/g, ' '), /model Experiment[\s\S]*?decision Decision\?/);
});

test('execution domain migration is additive and preserves existing action records', () => {
  assert.match(migration, /ALTER TABLE "Action" ADD COLUMN "projectId" TEXT/);
  assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM "Action"|TRUNCATE/i);
  for (const table of ['Project', 'Milestone', 'Decision', 'Experiment', 'Artifact']) assert.match(migration, new RegExp(`CREATE TABLE "${table}"`));
});

test('project, milestone, decision and experiment APIs enforce same-origin mutations and ownership filters', () => {
  for (const routeName of ['projects', 'milestones', 'decisions', 'experiments']) {
    const route = fs.readFileSync(path.join(root, `app/api/${routeName}/route.ts`), 'utf8');
    assert.match(route, /requireSameOrigin/);
    assert.match(route, /apiUser/);
    assert.match(route, /userId: user\.id/);
  }
});

test('account export contains execution and decision continuity records', () => {
  for (const key of ['projects', 'milestones', 'decisions', 'experiments', 'artifacts']) assert.match(exportRoute, new RegExp(`${key}`));
});
