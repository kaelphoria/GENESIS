const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadWorker() {
  const listeners = {};
  const calls = { deleted: [], opened: [], claimed: 0, skipped: 0 };
  const cache = {
    addAll: async () => {},
    match: async () => null,
    put: async () => {}
  };
  const caches = {
    open: async name => { calls.opened.push(name); return cache; },
    keys: async () => ['another-app-cache', 'genesis-private-local-v1', 'genesis-private-local-v2'],
    delete: async key => { calls.deleted.push(key); return true; },
    match: async () => null
  };
  const self = {
    location: { origin: 'https://example.test', href: 'https://example.test/app/' },
    clients: { claim: async () => { calls.claimed += 1; } },
    skipWaiting: async () => { calls.skipped += 1; },
    addEventListener: (name, callback) => { listeners[name] = callback }
  };
  const source = fs.readFileSync(path.join(__dirname, '../../iphone/sw.js'), 'utf8');
  vm.runInNewContext(source, { self, caches, URL, Promise });
  return { listeners, calls };
}

test('activation deletes only previous GENESIS caches', async () => {
  const { listeners, calls } = loadWorker();
  let activation;
  listeners.activate({ waitUntil: promise => { activation = promise; } });
  await activation;
  assert.deepEqual(calls.deleted, ['genesis-private-local-v1', 'genesis-private-local-v2']);
  assert.equal(calls.claimed, 1);
});

test('service worker bypasses API, dynamic routes, and cross-origin requests', () => {
  const { listeners } = loadWorker();
  const apiEvent = { request: { method: 'GET', url: 'https://example.test/api/me', headers: new Headers(), credentials: 'same-origin' }, respondWith() { throw new Error('API must bypass cache'); } };
  const externalEvent = { request: { method: 'GET', url: 'https://cdn.example.net/app.js', headers: new Headers(), credentials: 'same-origin' }, respondWith() { throw new Error('cross-origin must bypass cache'); } };
  const dynamicEvent = { request: { method: 'GET', url: 'https://example.test/private/page', headers: new Headers(), credentials: 'same-origin' }, respondWith() { throw new Error('dynamic routes must bypass cache'); } };
  assert.doesNotThrow(() => listeners.fetch(apiEvent));
  assert.doesNotThrow(() => listeners.fetch(externalEvent));
  assert.doesNotThrow(() => listeners.fetch(dynamicEvent));
});

test('service worker bypasses requests carrying authorization or cookies', () => {
  const { listeners } = loadWorker();
  const authorization = new Headers({ Authorization: 'Bearer private-token' });
  const authEvent = { request: { method: 'GET', url: 'https://example.test/private.json', headers: authorization, credentials: 'same-origin' }, respondWith() { throw new Error('authorized request must bypass cache'); } };
  const credentialEvent = { request: { method: 'GET', url: 'https://example.test/private.json', headers: new Headers(), credentials: 'include' }, respondWith() { throw new Error('credentialed request must bypass cache'); } };
  assert.doesNotThrow(() => listeners.fetch(authEvent));
  assert.doesNotThrow(() => listeners.fetch(credentialEvent));
});
