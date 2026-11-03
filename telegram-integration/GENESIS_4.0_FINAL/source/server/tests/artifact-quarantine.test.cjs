const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { quarantineArtifact, deleteQuarantinedArtifact } = require('../lib/continuity/artifact-quarantine.mjs');

async function tempRoot() { return fs.mkdtemp(path.join(os.tmpdir(), 'genesis-private-')); }

test('artifact quarantine detects content type, hashes server-side and writes owner-partitioned private files', async () => {
  const root = await tempRoot();
  try {
    const bytes = Buffer.from('%PDF-1.7\nprivate test');
    const result = await quarantineArtifact({ userId: 'owner-a', bytes, storageRoot: path.join(root, 'vault'), publicDir: path.join(root, 'public') });
    assert.equal(result.mediaType, 'application/pdf');
    assert.equal(result.sizeBytes, bytes.length);
    assert.match(result.contentHash, /^[a-f0-9]{64}$/);
    assert.equal(result.scanStatus, 'quarantined');
    assert.equal(result.downloadable, false);
    assert.match(result.storageKey, /^quarantine\/[a-f0-9]{64}\/[a-f0-9-]{36}\.quarantine$/);
    const stored = await fs.readFile(path.join(root, 'vault', result.storageKey));
    assert.deepEqual(stored, bytes);
    const stat = await fs.stat(path.join(root, 'vault', result.storageKey));
    assert.equal(stat.mode & 0o777, 0o600);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test('artifact quarantine rejects spoofed MIME, unsupported binary, oversize and public storage roots', async () => {
  const root = await tempRoot();
  try {
    await assert.rejects(() => quarantineArtifact({ userId: 'owner-a', bytes: Buffer.from([0, 1, 2, 3]), storageRoot: path.join(root, 'vault') }), /ARTIFACT_TYPE_NOT_ALLOWED/);
    await assert.rejects(() => quarantineArtifact({ userId: 'owner-a', bytes: Buffer.alloc(10 * 1024 * 1024 + 1), storageRoot: path.join(root, 'vault') }), /ARTIFACT_TOO_LARGE/);
    await fs.mkdir(path.join(root, 'public'), { recursive: true });
    await assert.rejects(() => quarantineArtifact({ userId: 'owner-a', bytes: Buffer.from('x'), storageRoot: path.join(root, 'public', 'uploads'), publicDir: path.join(root, 'public') }), /ARTIFACT_STORAGE_MUST_BE_PRIVATE/);
    await fs.symlink(path.join(root, 'public'), path.join(root, 'public-link'));
    await assert.rejects(() => quarantineArtifact({ userId: 'owner-a', bytes: Buffer.from('x'), storageRoot: path.join(root, 'public-link'), publicDir: path.join(root, 'public') }), /ARTIFACT_STORAGE_MUST_BE_PRIVATE/);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test('quarantine deletion is owner-scoped and rejects path traversal', async () => {
  const root = await tempRoot();
  try {
    const storageRoot = path.join(root, 'vault');
    const result = await quarantineArtifact({ userId: 'owner-a', bytes: Buffer.from('safe text'), storageRoot });
    await assert.rejects(() => deleteQuarantinedArtifact({ userId: 'owner-b', storageKey: result.storageKey, storageRoot }), /ARTIFACT_STORAGE_KEY_INVALID/);
    await assert.rejects(() => deleteQuarantinedArtifact({ userId: 'owner-a', storageKey: `quarantine/${'a'.repeat(64)}/../../secret`, storageRoot }), /ARTIFACT_STORAGE_KEY_INVALID/);
    assert.deepEqual(await deleteQuarantinedArtifact({ userId: 'owner-a', storageKey: result.storageKey, storageRoot }), { deleted: true });
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
