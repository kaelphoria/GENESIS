const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'prisma/migrations/202611030012_import_receipt_ledger/migration.sql'), 'utf8');
const helper = fs.readFileSync(path.join(root, 'lib/continuity/import-receipt.mjs'), 'utf8');
const preview = fs.readFileSync(path.join(root, 'app/api/import/preview/route.ts'), 'utf8');

test('import preview receipts are persisted, owner-cascaded and uniquely nonce-bound', () => {
  assert.match(schema, /model ImportPreviewReceipt\s*\{/);
  assert.match(schema, /importPreviewReceipts ImportPreviewReceipt\[\]/);
  assert.match(migration, /"nonce" TEXT NOT NULL/);
  assert.match(migration, /UNIQUE INDEX "ImportPreviewReceipt_nonce_key"/);
  assert.match(migration, /ON DELETE CASCADE/);
  assert.match(migration, /"consumedAt" TIMESTAMP\(3\)/);
  assert.match(preview, /db\.importPreviewReceipt\.create/);
});

test('future import apply has an atomic conditional one-time receipt consume primitive', () => {
  assert.match(helper, /tx\.importPreviewReceipt\.updateMany/);
  assert.match(helper, /consumedAt: null/);
  assert.match(helper, /result\.count === 1/);
  assert.match(helper, /payloadHash: claims\.payloadHash/);
  assert.match(helper, /schemaVersion: claims\.schemaVersion/);
});
