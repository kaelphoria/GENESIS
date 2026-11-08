const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('durable rate limit migration stores only hashed keys and has cleanup index', () => {
  const sql = fs.readFileSync(path.join(root, 'prisma/migrations/202611030002_durable_rate_limits/migration.sql'), 'utf8');
  assert.match(sql, /CREATE TABLE "RateLimitBucket"/);
  assert.match(sql, /"keyHash" TEXT NOT NULL/);
  assert.match(sql, /RateLimitBucket_updatedAt_idx/);
  assert.doesNotMatch(sql, /ipAddress|email|userAgent/i);
});

test('login, registration, and ORACLE enforce durable rate limits', () => {
  for (const file of ['app/api/auth/login/route.ts', 'app/api/auth/register/route.ts', 'app/api/chat/route.ts']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(source, /enforceRateLimit/);
    assert.match(source, /status: 429/);
    assert.match(source, /status: 503|jsonError\('Сервис защиты временно недоступен\.', 503\)/);
  }
});

test('rate limit keys are HMAC digests and database increments are atomic', () => {
  const source = fs.readFileSync(path.join(root, 'lib/rate-limit.ts'), 'utf8');
  assert.match(source, /createHmac\('sha256'/);
  assert.match(source, /ON CONFLICT \("keyHash"\) DO UPDATE/);
  assert.match(source, /"count" \+ 1/);
});

test('origin validation runs before rate-limit storage is touched', () => {
  for (const file of ['app/api/auth/login/route.ts', 'app/api/auth/register/route.ts']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(source.indexOf('if (originFailure) return originFailure;') < source.indexOf('enforceRateLimit('));
  }
});

test('chat uses the provider boundary for both embeddings and completion', () => {
  const source = fs.readFileSync(path.join(root, 'app/api/chat/route.ts'), 'utf8');
  assert.doesNotMatch(source, /import OpenAI from 'openai'/);
  assert.match(source, /createOracleEmbedding\(/);
  assert.match(source, /completeOracle\(/);
});

test('ORACLE retrieval is restricted to explicitly granted memories', () => {
  const source = fs.readFileSync(path.join(root, 'app/api/chat/route.ts'), 'utf8');
  assert.match(source, /contextPermission: 'granted'/);
  assert.match(source, /m\."contextPermission" = 'granted'/);
});

test('memory API accepts only explicit grant or revoke values and audits the change', () => {
  const source = fs.readFileSync(path.join(root, 'app/api/memories/route.ts'), 'utf8');
  assert.match(source, /body\.contextPermission === 'granted' \|\| body\.contextPermission === 'denied'/);
  assert.match(source, /contextPermissionChanged/);
});

test('memory governance migration defaults all existing records to private', () => {
  const sql = fs.readFileSync(path.join(root, 'prisma/migrations/202611030003_memory_context_governance/migration.sql'), 'utf8');
  assert.match(sql, /ADD COLUMN "contextPermission" TEXT NOT NULL DEFAULT 'denied'/);
  assert.match(sql, /MemoryRecord_userId_contextPermission_status_idx/);
});

test('memory interface exposes an explicit per-record grant and revoke control', () => {
  const source = fs.readFileSync(path.join(root, 'components/Dashboard.tsx'), 'utf8');
  assert.match(source, /РАЗРЕШИТЬ ORACLE ИСПОЛЬЗОВАТЬ/);
  assert.match(source, /ОТОЗВАТЬ/);
  assert.match(source, /contextPermission:m\.contextPermission==='granted'\?'denied':'granted'/);
});

test('chat API returns its context manifest and manual ORACLE explains its no-auto-context boundary', () => {
  const route = fs.readFileSync(path.join(root, 'app/api/chat/route.ts'), 'utf8');
  const ui = fs.readFileSync(path.join(root, 'components/ManualOracle.tsx'), 'utf8');
  assert.match(route, /contextManifest: contextResult\.manifest/);
  assert.match(ui, /CONTEXT INSPECTOR/);
  assert.match(ui, /не отправляет в ChatGPT твой профиль/);
});
