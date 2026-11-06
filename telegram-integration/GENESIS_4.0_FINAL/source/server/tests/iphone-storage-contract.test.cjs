const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '../../iphone');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'storage.js'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('local PWA keeps backward-compatible localStorage and mirrors snapshots to IndexedDB', () => {
  assert.ok(html.includes('localStorage.getItem(STORAGE_KEY)'));
  assert.ok(html.includes('GenesisStorage?.persist(db)'));
  assert.ok(storage.includes('indexedDB.open'));
  assert.ok(storage.includes('objectStore(SNAPSHOTS).put'));
  assert.ok(html.includes('GenesisStorage.restore()'));
});

test('snapshots use a versioned envelope and the dead legacy outbox is retired', () => {
  assert.ok(storage.includes('const DB_VERSION = 2'));
  assert.ok(storage.includes('deleteObjectStore(LEGACY_OUTBOX)'));
  assert.ok(storage.includes("put({ key: 'current', v: 1, data"));
  assert.ok(storage.includes('record.v === 1 ? record.data'));
  assert.ok(!storage.includes('SNAPSHOT_UPSERT'));
  assert.ok(!storage.includes("status: 'queued'"));
  assert.ok(!storage.includes('function clearOutbox'));
});

test('local-first PWA does not advertise an unimplemented remote sync feature', () => {
  for (const token of ['syncOptIn','setSyncOptIn','outboxStatus']) assert.ok(!html.includes(token));
  assert.ok(html.includes('никуда не отправляются'));
  assert.ok(!storage.includes('fetch('));
  assert.ok(!storage.includes('XMLHttpRequest'));
  assert.ok(!storage.includes('WebSocket'));
});

test('backup export is versioned and import validates before replacement with a safety copy', () => {
  assert.ok(html.includes("format:'genesis.private-local.backup',schemaVersion:4"));
  assert.ok(html.includes('p.schemaVersion>4'));
  assert.ok(html.includes('genesis-encrypted-backup-'));
  assert.ok(html.includes('Текущие данные будут заменены'));
  assert.ok(html.includes('await exportEncryptedData()'));
});

test('encrypted personal backup uses authenticated WebCrypto and a password-derived key', () => {
  assert.ok(html.includes('PBKDF2'));
  assert.ok(html.includes('iterations:310000'));
  assert.ok(html.includes('AES-GCM'));
  assert.ok(html.includes('genesis.private-local.encrypted-backup'));
});

test('personal workspace includes goals, projects, decisions, timeline and context-controlled ORACLE', () => {
  for (const id of ['goals','projects','decisions','timeline','oracle']) assert.ok(html.includes('id="' + id + '"'));
  assert.ok(html.includes('oracleUseDecisions'));
  assert.ok(html.includes('GENESIS UNIVERSE 4.0'));
});

test('service worker caches the IndexedDB adapter as part of the static shell', () => {
  assert.ok(worker.includes("'./storage.js'"));
});

test('IndexedDB quota failures surface an export action in Settings', () => {
  assert.ok(storage.includes('STORAGE_QUOTA_EXCEEDED'));
  assert.ok(html.includes('function showStorageWarning('));
  assert.ok(html.includes('Открыть экспорт'));
  assert.ok(html.includes('exportEncryptedData()'));
});

test('corrupt legacy localStorage does not block IndexedDB recovery', () => {
  assert.ok(html.includes('localStorage.removeItem(STORAGE_KEY)'));
  assert.ok(html.includes('structuredClone(defaults)'));
});
