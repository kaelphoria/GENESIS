const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { originAllowed } = require('../lib/origin-policy.mjs');

const apiRoot = path.join(__dirname, '../app/api');

test('origin policy accepts same origin and rejects hostile or absent origins', () => {
  assert.equal(originAllowed('https://genesis.example/path', 'https://genesis.example'), true);
  assert.equal(originAllowed('http://genesis.example', 'https://genesis.example'), false);
  assert.equal(originAllowed('https://evil.example', 'https://genesis.example'), false);
  assert.equal(originAllowed('null', 'https://genesis.example'), false);
  assert.equal(originAllowed(null, 'https://genesis.example'), false);
  assert.equal(originAllowed('not a url', 'https://genesis.example'), false);
});

test('every mutating API handler is protected by the same-origin guard', () => {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'route.ts') files.push(full);
    }
  }
  walk(apiRoot);
  const mutations = [];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) {
      const re = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`, 'g');
      if (re.test(source)) mutations.push({ file, method, source });
    }
  }
  assert.ok(mutations.length >= 10, `expected broad mutation coverage, found ${mutations.length}`);
  for (const item of mutations) {
    assert.match(item.source, /requireSameOrigin\s*\(/, `${path.relative(apiRoot, item.file)} ${item.method} missing origin guard`);
  }
});
