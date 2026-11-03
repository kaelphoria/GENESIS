const test = require('node:test');
const assert = require('node:assert/strict');
const { listCapabilities, canUseCapability } = require('../lib/oracle/capability-registry.mjs');

test('planned and disconnected capabilities are never advertised as enabled', () => {
  const items = listCapabilities({ includeContext: true });
  assert.equal(items.find(x => x.id === 'projects.manage').enabled, false);
  assert.equal(items.find(x => x.id === 'web.research').enabled, false);
  assert.equal(items.find(x => x.id === 'devices.sync').enabled, false);
  assert.equal(items.find(x => x.id === 'oracle.respond').enabled, true);
});

test('personal memory requires an explicit context grant', () => {
  assert.deepEqual(canUseCapability('memory.read'), { allowed: false, reason: 'PERSONAL_CONTEXT_NOT_GRANTED' });
  assert.deepEqual(canUseCapability('memory.read', { includeContext: true }), { allowed: true, reason: null });
});

test('unknown capability fails closed', () => {
  assert.equal(canUseCapability('filesystem.delete').allowed, false);
});
