const test = require('node:test');
const assert = require('node:assert/strict');
const { encryptBackup, decryptBackup } = require('../lib/continuity/backup-envelope.mjs');
const KEY = Buffer.alloc(32, 7).toString('base64');

test('backup envelope encrypts and restores exact plaintext with authenticated encryption', () => {
  const payload = JSON.stringify({ format: 'genesis.account-export', schemaVersion: 6, memories: [{ id: 'm1' }] });
  const envelope = encryptBackup(payload, KEY);
  assert.equal(envelope.format, 'genesis.encrypted-backup');
  assert.equal(envelope.algorithm, 'A256GCM');
  assert.notEqual(envelope.ciphertext, Buffer.from(payload).toString('base64url'));
  assert.equal(decryptBackup(envelope, KEY), payload);
});

test('backup envelope rejects a wrong key, tampered ciphertext and changed associated data', () => {
  const envelope = encryptBackup('private', KEY);
  assert.throws(() => decryptBackup(envelope, Buffer.alloc(32, 8).toString('base64')), /BACKUP_AUTHENTICATION_FAILED/);
  const replacement = envelope.ciphertext[0] === 'A' ? 'B' : 'A';
  const tampered = { ...envelope, ciphertext: replacement + envelope.ciphertext.slice(1) };
  assert.throws(() => decryptBackup(tampered, KEY), /BACKUP_AUTHENTICATION_FAILED|BACKUP_HASH_MISMATCH/);
  assert.throws(() => decryptBackup(envelope, KEY, { associatedData: 'other-purpose' }), /BACKUP_AUTHENTICATION_FAILED/);
});

test('backup envelope fails closed on missing or invalid keys and unsupported format', () => {
  assert.throws(() => encryptBackup('x', ''), /BACKUP_KEY_NOT_CONFIGURED/);
  assert.throws(() => encryptBackup('x', Buffer.alloc(16).toString('base64')), /BACKUP_KEY_MUST_BE_32_BYTES/);
  assert.throws(() => decryptBackup({ format: 'unknown' }, KEY), /BACKUP_ENVELOPE_UNSUPPORTED/);
});

test('backup envelope enforces strict encoded fields and bounded payload sizes', () => {
  assert.throws(() => encryptBackup('x'.repeat(25 * 1024 * 1024 + 1), KEY), /BACKUP_PAYLOAD_TOO_LARGE/);
  assert.throws(() => encryptBackup('x', KEY, { associatedData: 'a'.repeat(257) }), /BACKUP_ASSOCIATED_DATA_INVALID/);
  const envelope = encryptBackup('small', KEY);
  assert.throws(() => decryptBackup({ ...envelope, iv: `${envelope.iv}=` }, KEY), /BACKUP_ENVELOPE_INVALID/);
  assert.throws(() => decryptBackup({ ...envelope, ciphertext: 'A'.repeat(40_000_000) }, KEY), /BACKUP_ENVELOPE_INVALID/);
});
