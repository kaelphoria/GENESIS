const test = require('node:test');
const assert = require('node:assert/strict');
const { createImportPreviewReceipt, verifyImportPreviewReceipt } = require('../lib/continuity/import-receipt.mjs');
const fs = require('node:fs');
const path = require('node:path');
const route = fs.readFileSync(path.join(__dirname, '..', 'app/api/import/preview/route.ts'), 'utf8');

const secret = 'x'.repeat(48);
const claims = { userId: 'user-1', payloadHash: 'a'.repeat(64), schemaVersion: 3 };

test('preview receipt is signed, user-bound, payload-bound and expires', () => {
  const receipt = createImportPreviewReceipt(claims, secret);
  assert.equal(typeof receipt, 'string');
  assert.equal(verifyImportPreviewReceipt(receipt, claims, secret)?.userId, 'user-1');
  assert.equal(verifyImportPreviewReceipt(receipt, { ...claims, userId: 'user-2' }, secret), null);
  assert.equal(verifyImportPreviewReceipt(receipt, { ...claims, payloadHash: 'b'.repeat(64) }, secret), null);
  assert.equal(verifyImportPreviewReceipt(receipt, claims, secret, Date.now() + 11 * 60 * 1000), null);
});

test('preview receipt fails closed without a strong signing secret or with tampering', () => {
  const receipt = createImportPreviewReceipt(claims, secret);
  assert.equal(createImportPreviewReceipt(claims, 'short'), null);
  assert.equal(verifyImportPreviewReceipt(`${receipt}x`, claims, secret), null);
  assert.equal(verifyImportPreviewReceipt(receipt, claims, 'short'), null);
});

test('import preview receipt binds the exact raw payload hash and does not mutate records', () => {
  assert.match(route.replace(/\s+/g, ' '), /createHash\('sha256'\)\s*\.update\(raw\)/);
  assert.match(route.replace(/\s+/g, ' '), /createImportPreviewReceipt/);
  assert.match(route.replace(/\s+/g, ' '), /receiptExpiresInSeconds/);
  assert.match(route.replace(/\s+/g, ' '), /db\.importPreviewReceipt\.create/);
  assert.doesNotMatch(route, /db\.(world|goal|action|memoryRecord|conversation|chatMessage|project|decision|lifeEvent)\.(create|update|delete)/);
});

test('receipt consumption is atomic, one-time and bound to the persisted nonce', async () => {
  const { consumeImportPreviewReceipt } = await import('../lib/continuity/import-receipt.mjs');
  const receipt = createImportPreviewReceipt(claims, secret);
  const nonce = verifyImportPreviewReceipt(receipt, claims, secret).nonce;
  let consumed = false;
  const tx = { importPreviewReceipt: { updateMany: async ({ where, data }) => {
    assert.equal(where.nonce, nonce);
    assert.equal(where.userId, claims.userId);
    assert.equal(where.payloadHash, claims.payloadHash);
    assert.equal(where.consumedAt, null);
    assert.ok(where.expiresAt.gt instanceof Date);
    if (consumed) return { count: 0 };
    consumed = true;
    assert.ok(data.consumedAt instanceof Date);
    return { count: 1 };
  } } };
  const first = await consumeImportPreviewReceipt(tx, receipt, claims, secret);
  const second = await consumeImportPreviewReceipt(tx, receipt, claims, secret);
  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'RECEIPT_ALREADY_USED_OR_UNKNOWN');
});

test('preview endpoint uses a streaming byte limit and persists receipt nonce', () => {
  assert.match(route.replace(/\s+/g, ' '), /readLimitedText\(\s*req,\s*MAX_IMPORT_BYTES\s*\)/);
  assert.match(route.replace(/\s+/g, ' '), /req\.body\.getReader\(\)/);
  assert.match(route.replace(/\s+/g, ' '), /db\.importPreviewReceipt\.create/);
  assert.match(route.replace(/\s+/g, ' '), /IMPORT_PREVIEW_CREATED/);
});
