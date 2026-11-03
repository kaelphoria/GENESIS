const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const route = fs.readFileSync(path.join(__dirname, '..', 'app/api/export/route.ts'), 'utf8');
const schema = fs.readFileSync(path.join(__dirname, '..', 'prisma/schema.prisma'), 'utf8');

test('account export declares a stable format and schema version', () => {
  assert.match(route, /format:'genesis\.account-export',schemaVersion:6/);
});

test('account export includes memory context permissions and continuity records', () => {
  assert.match(route, /db\.memoryRecord\.findMany/);
  assert.match(route, /chatRequests/);
  assert.match(schema, /contextManifest Json\?/);
});

test('account export is private and records an audit event', () => {
  assert.match(route, /event:'DATA_EXPORTED'/);
  assert.match(route, /Cache-Control':'no-store'/);
});
