const test = require('node:test');
const assert = require('node:assert/strict');
const { buildContextManifest, renderContextManifest } = require('../lib/oracle/context-policy.mjs');

test('context manifest records provenance and does not claim independent verification', () => {
  const manifest = buildContextManifest({
    profile: { values: 'honesty', direction: 'build', currentFocus: 'focus', supportStyle: 'direct' },
    memories: [{ id: 'm1', title: 'Preference', content: 'Short answers', source: 'USER_ENTERED', classification: 'USER_STATEMENT', updatedAt: new Date('2026-01-01T00:00:00Z') }],
    worlds: [{ title: 'Work', intention: 'Create' }]
  });
  assert.equal(manifest.includedCount, 3);
  assert.match(manifest.policy, /NO_INDEPENDENT_VERIFICATION_CLAIM/);
  assert.ok(manifest.entries.every(entry => /NOT_INDEPENDENTLY_VERIFIED/.test(entry.trust)));
  assert.match(renderContextManifest(manifest), /USER_ENTERED/);
});

test('context manifest respects the character budget and marks truncation', () => {
  const manifest = buildContextManifest({
    profile: null,
    memories: [{ id: 'm1', title: 'Large', content: 'x'.repeat(1000), source: 'USER_ENTERED', updatedAt: new Date() }],
    worlds: [],
    budget: 100
  });
  const total = manifest.entries.reduce((sum, entry) => sum + entry.content.length, 0);
  assert.ok(total <= 100);
  assert.equal(manifest.truncated, true);
});

test('empty context produces an explicit no-context statement', () => {
  const manifest = buildContextManifest({ profile: null, memories: [], worlds: [] });
  assert.equal(manifest.includedCount, 0);
  assert.match(renderContextManifest(manifest), /No authorized personal context/);
});


test('memory context retains source trust metadata without upgrading the memory trust claim', () => {
  const manifest = buildContextManifest({ profile: null, worlds: [], memories: [{ id: 'm2', title: 'Fact', content: 'Text', source: 'USER_ENTERED', classification: 'USER_STATEMENT', confidence: 0.7, sourceRef: { id: 's1', title: 'Document', trustStatus: 'unverified' }, updatedAt: new Date() }] });
  assert.equal(manifest.entries[0].sourceRef.trustStatus, 'unverified');
  assert.equal(manifest.entries[0].confidence, 0.7);
  assert.equal(manifest.entries[0].trust, 'SAVED_BY_USER_NOT_INDEPENDENTLY_VERIFIED');
  const rendered = renderContextManifest(manifest);
  assert.match(rendered, /recorded trust label: unverified; not independently verified by GENESIS/);
  assert.match(rendered, /User-entered confidence: 0.7/);
});
