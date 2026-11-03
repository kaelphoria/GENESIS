const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const workspace = fs.readFileSync(path.join(root, 'components/ExecutionWorkspace.tsx'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'components/Dashboard.tsx'), 'utf8');
const decisionRoute = fs.readFileSync(path.join(root, 'app/api/decisions/route.ts'), 'utf8');

test('canonical dashboard exposes Projects and Decision Lab navigation', () => {
  assert.match(dashboard, /\['projects','PROJECTS',Target\]/);
  assert.match(dashboard, /\['decisions','DECISION LAB',Scale\]/);
  assert.match(dashboard, /ExecutionWorkspace mode="projects"/);
  assert.match(dashboard, /ExecutionWorkspace mode="decisions"/);
});

test('project workspace creates projects and milestones and supports milestone lifecycle updates', () => {
  assert.match(workspace, /request\('\/api\/projects', 'POST'/);
  assert.match(workspace, /request\('\/api\/milestones', 'POST'/);
  assert.match(workspace, /request\('\/api\/milestones', 'PATCH'/);
  assert.match(workspace, /value="in_progress"/);
});

test('decision workspace records options, selected outcomes and experiments', () => {
  assert.match(workspace, /request\('\/api\/decisions', 'POST'/);
  assert.match(workspace, /request\('\/api\/decisions', 'PATCH'/);
  assert.match(workspace, /request\('\/api\/experiments', 'POST'/);
  assert.match(workspace, /request\('\/api\/experiments', 'PATCH'/);
});

test('decision API returns project context and related experiments', () => {
  assert.match(decisionRoute, /include: \{ experiments: true, goal: \{ select: \{ id: true, title: true \} \}, project: \{ select: \{ id: true, title: true \} \} \}/);
});
