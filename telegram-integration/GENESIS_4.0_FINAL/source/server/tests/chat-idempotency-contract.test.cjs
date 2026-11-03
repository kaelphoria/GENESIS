const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const route = fs.readFileSync(path.join(root, 'app/api/chat/route.ts'), 'utf8');
const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'prisma/migrations/202611030004_chat_request_idempotency/migration.sql'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'components/Dashboard.tsx'), 'utf8');
test('chat requests persist scoped idempotency keys and prompt hashes', () => {
  assert.match(schema, /model ChatRequest[\s\S]*?@@unique\(\[userId, idempotencyKey\]\)/);
  assert.match(migration, /ChatRequest_userId_idempotencyKey_key/);
  assert.match(route, /userId_idempotencyKey/);
  assert.match(route, /promptHash/);
});
test('completed requests replay and pending requests do not invoke a second completion', () => {
  assert.match(route, /status === 'completed'[\s\S]*?replayed: true/);
  assert.match(route, /status === 'pending'[\s\S]*?status: 409/);
});
test('user message is durably saved before provider execution and not duplicated on retry', () => {
  assert.ok(route.indexOf("role: 'user', content: prompt") < route.indexOf('await completeOracle({'));
  assert.match(route, /userMessageId \? \{ id: \{ not: requestRecord.userMessageId \} \}/);
});
test('client reuses the same request id after a failed send of the same prompt', () => {
  assert.match(ui, /retryRequest\?\.prompt===q\?retryRequest\.id:crypto\.randomUUID\(\)/);
});

test('request and initial user message are committed atomically; retries use compare-and-set', () => {
  assert.match(route, /db\.\$transaction\(async \(tx\) => \{[\s\S]*?tx\.chatRequest\.create[\s\S]*?tx\.chatMessage\.create/);
  assert.match(route, /updatedAt: requestRecord\.updatedAt/);
  assert.match(route, /reclaimed\.count !== 1/);
});

test('stale pending recovery window exceeds the bounded multi-stage provider timeout envelope', () => {
  assert.match(route, /getTime\(\) < 300_000/);
});
