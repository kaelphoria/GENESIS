const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const script = path.join(__dirname, '..', 'scripts', 'release-preflight.mjs');

function run(env) {
  return spawnSync(process.execPath, [script], { encoding: 'utf8', env: { ...process.env, ...env } });
}

test('production preflight rejects missing secrets and non-TLS database/app origins', () => {
  const result = run({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:p@db:5432/genesis', AUTH_SECRET: 'short', APP_URL: 'http://example.com', GENESIS_APP_ORIGIN: 'http://example.com' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /sslmode/);
  assert.match(result.stderr, /AUTH_SECRET/);
  assert.match(result.stderr, /HTTPS/);
});

test('production preflight accepts canonical HTTPS origins and TLS PostgreSQL', () => {
  const result = run({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:p@db:5432/genesis?sslmode=require', AUTH_SECRET: 'a'.repeat(48), APP_URL: 'https://genesis.example', GENESIS_APP_ORIGIN: 'https://genesis.example', GENESIS_BOOTSTRAP_TOKEN: 'b'.repeat(48), OPENAI_API_KEY: 'test-key' });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /preflight: PASS/);
});

test('production preflight rejects origin paths and mismatched app origins', () => {
  const result = run({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:p@db:5432/genesis?sslmode=require', AUTH_SECRET: 'a'.repeat(48), APP_URL: 'https://genesis.example', GENESIS_APP_ORIGIN: 'https://other.example/path' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /canonical HTTPS origin/);
  assert.match(result.stderr, /must match APP_URL/);
});

test('development preflight permits loopback PostgreSQL without production HTTPS settings', () => {
  const result = run({ NODE_ENV: 'development', DATABASE_URL: 'postgresql://u:p@localhost:5432/genesis', AUTH_SECRET: 'a'.repeat(32), APP_URL: 'http://localhost:3000', GENESIS_APP_ORIGIN: 'http://localhost:3000' });
  assert.equal(result.status, 0, result.stderr + result.stdout);
});
