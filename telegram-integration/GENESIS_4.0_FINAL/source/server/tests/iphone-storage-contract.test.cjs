const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '../../iphone');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'storage.js'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('local PWA keeps backward-compatible localStorage and mirrors snapshots to IndexedDB', () => {
  assert.match(html, /localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(html, /GenesisStorage\?\.persist\(db,db\.syncOptIn\)/);
  assert.match(storage, /indexedDB\.open/);
  assert.match(storage, /objectStore\(SNAPSHOTS\)\.put/);
  assert.match(html, /GenesisStorage\.restore\(\)/);
});

test('snapshot and opt-in outbox updates share one IndexedDB transaction', () => {
  assert.match(storage, /transaction\(\[SNAPSHOTS, OUTBOX\], 'readwrite'\)/);
  assert.match(storage, /if \(syncOptIn\)/);
  assert.match(storage, /type: 'SNAPSHOT_UPSERT'/);
  assert.match(storage, /status: 'queued'/);
  assert.match(storage, /count > 50/);
});

test('local sync opt-in is explicit and does not transmit data to a remote service', () => {
  assert.match(html, /onchange="setSyncOptIn\(this\.checked\)"/);
  assert.match(html, /Передача на сервер не выполняется/);
  assert.doesNotMatch(storage, /fetch\(|XMLHttpRequest|WebSocket/);
});

test('backup export is versioned and import validates before replacement with a safety copy', () => {
  assert.match(html, /format:'genesis\.private-local\.backup',schemaVersion:4/);
  assert.match(html, /p\.schemaVersion>4/);
  assert.match(html, /genesis-encrypted-backup-/);
  assert.match(html, /Текущие данные будут заменены/);
  assert.match(html, /await exportEncryptedData\(\)/);
});

test('encrypted personal backup uses authenticated WebCrypto and a password-derived key', () => {
  assert.match(html, /PBKDF2/);
  assert.match(html, /iterations:310000/);
  assert.match(html, /AES-GCM/);
  assert.match(html, /genesis.private-local.encrypted-backup/);
});

test('personal workspace includes goals, projects, decisions, timeline and context-controlled ORACLE', () => {
  for (const id of ['goals','projects','decisions','timeline','oracle']) assert.match(html, new RegExp(`id=\"${id}\"`));
  assert.match(html, /oracleUseDecisions/);
  assert.match(html, /GENESIS UNIVERSE 4\.0/);
});

test('service worker caches the IndexedDB adapter as part of the static shell', () => {
  assert.match(worker, /'\.\/storage\.js'/);
});

test('disabling sync consent purges queued personal snapshots', () => {
  assert.match(storage, /async function clearOutbox\(\)/);
  assert.match(storage, /clearOutbox/);
  assert.match(html, /if\(!db\.syncOptIn\)await window\.GenesisStorage\?\.clearOutbox\(\)/);
});

test('corrupt legacy localStorage does not block IndexedDB recovery', () => {
  assert.match(html, /localStorage\.removeItem\(STORAGE_KEY\).*structuredClone\(defaults\)/);
});
