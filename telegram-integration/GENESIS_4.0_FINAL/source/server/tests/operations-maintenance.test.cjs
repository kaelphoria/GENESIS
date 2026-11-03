const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const cleanup = fs.readFileSync(path.join(root, 'scripts/cleanup-rate-limits.mjs'), 'utf8');
const health = fs.readFileSync(path.join(root, 'app/api/health/details/route.ts'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

test('rate-limit maintenance is dry-run by default and has a separate explicit apply gate', () => {
  assert.match(cleanup, /const apply = process\.argv\.includes\('--apply'\)/);
  assert.match(cleanup, /mode: 'dry-run'/);
  assert.match(cleanup, /GENESIS_MAINTENANCE_CONFIRM/);
  assert.match(cleanup, /DELETE_EXPIRED_RATE_LIMIT_BUCKETS/);
  assert.match(cleanup, /updatedAt: \{ lt: cutoff \}/);
});

test('rate-limit cleanup has a minimum seven-day retention and touches no user records', () => {
  assert.match(cleanup, /Number\.isFinite\(requestedRetentionDays\)/);
  assert.match(cleanup, /Math\.max\(7,/);
  assert.doesNotMatch(cleanup, /memoryRecord|chatMessage|chatRequest|auditEvent/);
  assert.equal(packageJson.scripts['maintenance:rate-limits'], 'node scripts/cleanup-rate-limits.mjs');
});

test('authenticated diagnostics expose aggregate health counts without personal content or secrets', () => {
  assert.match(health, /apiUser/);
  assert.match(health, /pendingEmbeddings/);
  assert.match(health, /failedEmbeddings/);
  assert.match(health, /stalePendingRequests/);
  assert.match(health, /pricingCatalogConfigured/);
  assert.doesNotMatch(health, /OPENAI_API_KEY\s*[,}:]/);
  assert.doesNotMatch(health, /content|prompt|passwordHash|embedding\b/);
});

test('import receipt cleanup is dry-run by default and separately confirmed', () => {
  const cleanupReceipts = fs.readFileSync(path.join(root, 'scripts/cleanup-import-receipts.mjs'), 'utf8');
  assert.match(cleanupReceipts, /const apply = process\.argv\.includes\('--apply'\)/);
  assert.match(cleanupReceipts, /mode: 'dry-run'/);
  assert.match(cleanupReceipts, /GENESIS_MAINTENANCE_CONFIRM/);
  assert.match(cleanupReceipts, /DELETE_EXPIRED_IMPORT_RECEIPTS/);
  assert.match(cleanupReceipts, /expiresAt: \{ lt: cutoff \}/);
  assert.equal(packageJson.scripts['maintenance:import-receipts'], 'node scripts/cleanup-import-receipts.mjs');
});
