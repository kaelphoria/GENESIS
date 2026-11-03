const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeAccountExport } = require('../lib/continuity/import-preview.mjs');
const fs = require('node:fs');
const path = require('node:path');
const route = fs.readFileSync(path.join(__dirname, '..', 'app/api/import/preview/route.ts'), 'utf8');

function sample() {
  return {
    format: 'genesis.account-export', schemaVersion: 6, profile: {},
    worlds: [{ id: 'w1' }], goals: [{ id: 'g1', worldId: 'w1' }], actions: [{ id: 'a1', worldId: 'w1', goalId: 'g1' }], memories: [{ id: 'm1', sourceRefId: 's1' }],
    conversations: [{ id: 'c1' }], messages: [{ id: 'msg1', conversationId: 'c1' }], chatRequests: [{ id: 'r1', conversationId: 'c1', userMessageId: 'msg1' }],
    projects: [{ id: 'p1', goalId: 'g1' }], milestones: [{ id: 'ms1', projectId: 'p1' }], decisions: [{ id: 'd1', projectId: 'p1', goalId: 'g1' }],
    experiments: [{ id: 'e1', decisionId: 'd1' }], artifacts: [{ id: 'ar1', projectId: 'p1' }], sources: [{ id: 's1' }],
    memoryVersions: [{ id: 'mv1', memoryId: 'm1' }], provenanceEvents: [{ id: 'pe1', sourceId: 's1', memoryId: 'm1', artifactId: 'ar1' }],
    lifeEvents: [{ id: 'le1', projectId: 'p1', goalId: 'g1', decisionId: 'd1', sourceId: 's1' }],
    lifeEventVersions: [{ id: 'lev1', eventId: 'le1' }]
  };
}

test('account import preview accepts a complete version-one export without mutating data', () => {
  const result = analyzeAccountExport(sample());
  assert.equal(result.valid, true);
  assert.equal(result.totalRecords, 17);
  assert.equal(result.mutationPerformed, false);
});

test('account import preview detects duplicate IDs and dangling relations', () => {
  const payload = sample();
  payload.projects.push({ id: 'p1' });
  payload.milestones[0].projectId = 'missing';
  const result = analyzeAccountExport(payload);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.startsWith('DUPLICATE_ID:projects')));
  assert.ok(result.errors.some(error => error.startsWith('DANGLING_REFERENCE:milestones')));
});

test('account import preview rejects future schema versions and malformed collections', () => {
  const payload = sample();
  payload.schemaVersion = 99;
  payload.decisions = {};
  const result = analyzeAccountExport(payload);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('UNSUPPORTED_FUTURE_SCHEMA_VERSION'));
  assert.ok(result.errors.includes('COLLECTION_NOT_ARRAY:decisions'));
});

test('preview endpoint is authenticated, same-origin and only writes a one-time receipt ledger entry', () => {
  assert.match(route, /requireSameOrigin/);
  assert.match(route, /apiUser/);
  assert.match(route, /enforceRateLimit/);
  assert.match(route, /account-import-preview/);
  assert.match(route, /analyzeAccountExport/);
  assert.match(route, /db\.importPreviewReceipt\.create/);
  assert.doesNotMatch(route, /db\.(world|goal|action|memoryRecord|conversation|chatMessage|project|decision|lifeEvent)\.(create|update|delete)/);
  assert.match(route, /MAX_IMPORT_BYTES/);
});

test('preview supports earlier declared account export versions with compatibility warnings for missing arrays', () => {
  const payload = sample();
  payload.schemaVersion = 1;
  delete payload.sources;
  delete payload.memoryVersions;
  delete payload.provenanceEvents;
  const result = analyzeAccountExport(payload);
  assert.equal(result.valid, true);
  assert.ok(result.warnings.includes('MISSING_COLLECTION:sources'));
});

test('version-four preview validates Life Timeline links to owned export collections', () => {
  const payload = sample();
  payload.lifeEvents[0].decisionId = 'missing';
  const result = analyzeAccountExport(payload);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.startsWith('DANGLING_REFERENCE:lifeEvents')));
});

test('version-five preview validates immutable Life Timeline version references', () => {
  const payload = sample();
  payload.lifeEventVersions[0].eventId = 'missing';
  const result = analyzeAccountExport(payload);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.startsWith('DANGLING_REFERENCE:lifeEventVersions')));
});

test('version-six preview validates goal references across projects, actions, decisions and events', () => {
  const payload = sample();
  payload.projects[0].goalId = 'missing';
  const result = analyzeAccountExport(payload);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.startsWith('DANGLING_REFERENCE:projects')));
});
