const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'prisma/migrations/202611030011_goals/migration.sql'), 'utf8');
const goalsRoute = fs.readFileSync(path.join(root, 'app/api/goals/route.ts'), 'utf8');
const projectRoute = fs.readFileSync(path.join(root, 'app/api/projects/route.ts'), 'utf8');
const actionRoute = fs.readFileSync(path.join(root, 'app/api/actions/route.ts'), 'utf8');
const decisionRoute = fs.readFileSync(path.join(root, 'app/api/decisions/route.ts'), 'utf8');
const eventRoute = fs.readFileSync(path.join(root, 'app/api/life-events/route.ts'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'components/Dashboard.tsx'), 'utf8');
const goalsUi = fs.readFileSync(path.join(root, 'components/GoalsWorkspace.tsx'), 'utf8');
const exportRoute = fs.readFileSync(path.join(root, 'app/api/export/route.ts'), 'utf8');

test('Goal is user-owned and connects worlds, projects, actions, decisions and Life Timeline events', () => {
  assert.match(schema.replace(/\s+/g, ' '), /model Goal \{[\s\S]*?user User @relation/);
  assert.match(schema.replace(/\s+/g, ' '), /world World\? @relation\(fields: \[worldId\], references: \[id\], onDelete: SetNull\)/);
  assert.match(schema.replace(/\s+/g, ' '), /projects Project\[\]/);
  assert.match(schema.replace(/\s+/g, ' '), /actions Action\[\]/);
  assert.match(schema.replace(/\s+/g, ' '), /decisions Decision\[\]/);
  assert.match(schema.replace(/\s+/g, ' '), /lifeEvents LifeEvent\[\]/);
  for (const model of ['Action', 'Project', 'Decision', 'LifeEvent']) assert.match(schema.replace(/\s+/g, ' '), new RegExp(`model ${model} \\{[\\s\\S]*?goalId String\\?[\\s\\S]*?goal Goal\\?`));
});

test('Goal migration is additive and preserves linked records when a goal is removed', () => {
  assert.match(migration, /CREATE TABLE "Goal"/);
  for (const table of ['Action', 'Project', 'Decision', 'LifeEvent']) assert.match(migration, new RegExp(`ALTER TABLE "${table}" ADD COLUMN "goalId" TEXT`));
  assert.equal((migration.match(/ON DELETE SET NULL/g) || []).length, 5);
  assert.match(migration, /Goal_userId_status_updatedAt_idx/);
  assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM|TRUNCATE/i);
});

test('Goal API is authenticated, same-origin on writes, owner-scoped and validates world ownership', () => {
  assert.match(goalsRoute, /apiUser/);
  assert.match(goalsRoute, /requireSameOrigin/);
  assert.match(goalsRoute, /where: \{ id: parsed\.data\.worldId, userId: user\.id \}/);
  assert.match(goalsRoute, /where: \{ id, userId: user\.id \}/);
  assert.match(goalsRoute, /GOAL_CREATED/);
  assert.match(goalsRoute, /GOAL_DELETED/);
});

test('Projects, actions, decisions and events validate goal ownership before linking', () => {
  assert.match(projectRoute, /db\.goal\.findFirst/);
  assert.match(actionRoute, /db\.goal\.findFirst/);
  assert.match(decisionRoute, /db\.goal\.findFirst/);
  assert.match(eventRoute, /db\.goal\.findFirst/);
});

test('Dashboard and execution workspaces expose Goals and link related records', () => {
  assert.match(dashboard, /GOALS/);
  assert.match(dashboard, /tab==='goals'&&<GoalsWorkspace\/>/);
  assert.match(goalsUi, /request\('\/api\/goals'/);
  assert.match(goalsUi, /request\('\/api\/worlds'/);
  const execution = fs.readFileSync(path.join(root, 'components/ExecutionWorkspace.tsx'), 'utf8');
  assert.match(execution, /Связанная цель/);
  assert.match(execution, /decisionForm\.goalId/);
});

test('Account export schema 6 includes goals and import preview validates cross-links', () => {
  assert.match(exportRoute, /schemaVersion:6/);
  assert.match(exportRoute, /db\.goal\.findMany/);
  assert.match(exportRoute, /worlds,goals,actions/);
  const preview = fs.readFileSync(path.join(root, 'lib/continuity/import-preview.mjs'), 'utf8');
  assert.match(preview, /'goals'/);
  assert.match(preview, /\['goals', 'worldId', 'worlds'\]/);
  assert.match(preview, /\['projects', 'goalId', 'goals'\]/);
  assert.match(preview, /\['decisions', 'goalId', 'goals'\]/);
});
