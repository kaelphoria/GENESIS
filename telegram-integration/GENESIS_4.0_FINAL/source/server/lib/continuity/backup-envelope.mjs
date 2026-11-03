import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 1;
const MAX_PLAINTEXT_BYTES = 25 * 1024 * 1024;
const MAX_ASSOCIATED_DATA_BYTES = 256;

function assertAssociatedData(value) {
  if (typeof value !== 'string' || !value || Buffer.byteLength(value, 'utf8') > MAX_ASSOCIATED_DATA_BYTES) throw new Error('BACKUP_ASSOCIATED_DATA_INVALID');
  return value;
}

function decodeBase64Url(value, maxBytes) {
  if (typeof value !== 'string' || !value || !/^[A-Za-z0-9_-]+$/.test(value) || value.length > Math.ceil(maxBytes * 4 / 3) + 4) throw new Error('BACKUP_ENVELOPE_INVALID');
  const decoded = Buffer.from(value, 'base64url');
  if (decoded.length > maxBytes || decoded.toString('base64url') !== value) throw new Error('BACKUP_ENVELOPE_INVALID');
  return decoded;
}

function decodeKey(key) {
  if (typeof key !== 'string' || !key.trim()) throw new Error('BACKUP_KEY_NOT_CONFIGURED');
  const normalized = key.trim();
  const isHex = /^[a-f0-9]{64}$/i.test(normalized);
  const bytes = isHex ? Buffer.from(normalized, 'hex') : Buffer.from(normalized, 'base64');
  if (bytes.length !== 32) throw new Error('BACKUP_KEY_MUST_BE_32_BYTES');
  if (!isHex && bytes.toString('base64').replace(/=+$/, '') !== normalized.replace(/=+$/, '')) throw new Error('BACKUP_KEY_INVALID_ENCODING');
  return bytes;
}

export function encryptBackup(plaintext, key, { associatedData = 'GENESIS_ACCOUNT_BACKUP_V1' } = {}) {
  if (typeof plaintext !== 'string') throw new Error('BACKUP_PAYLOAD_MUST_BE_STRING');
  if (Buffer.byteLength(plaintext, 'utf8') > MAX_PLAINTEXT_BYTES) throw new Error('BACKUP_PAYLOAD_TOO_LARGE');
  associatedData = assertAssociatedData(associatedData);
  const keyBytes = decodeKey(key);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, keyBytes, iv);
  cipher.setAAD(Buffer.from(associatedData, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    format: 'genesis.encrypted-backup', version: VERSION, algorithm: 'A256GCM',
    encryptedAt: new Date().toISOString(),
    plaintextSha256: createHash('sha256').update(plaintext, 'utf8').digest('hex'),
    iv: iv.toString('base64url'), tag: tag.toString('base64url'), ciphertext: ciphertext.toString('base64url')
  };
}

export function decryptBackup(envelope, key, { associatedData = 'GENESIS_ACCOUNT_BACKUP_V1' } = {}) {
  if (!envelope || envelope.format !== 'genesis.encrypted-backup' || envelope.version !== VERSION || envelope.algorithm !== 'A256GCM') throw new Error('BACKUP_ENVELOPE_UNSUPPORTED');
  associatedData = assertAssociatedData(associatedData);
  const keyBytes = decodeKey(key);
  let iv, tag, ciphertext;
  try {
    iv = decodeBase64Url(envelope.iv, 12);
    tag = decodeBase64Url(envelope.tag, 16);
    ciphertext = decodeBase64Url(envelope.ciphertext, MAX_PLAINTEXT_BYTES);
  } catch { throw new Error('BACKUP_ENVELOPE_INVALID'); }
  if (iv.length !== 12 || tag.length !== 16 || !/^[a-f0-9]{64}$/i.test(envelope.plaintextSha256 || '')) throw new Error('BACKUP_ENVELOPE_INVALID');
  try {
    const decipher = createDecipheriv(ALGORITHM, keyBytes, iv);
    decipher.setAAD(Buffer.from(associatedData, 'utf8'));
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    const actualHash = Buffer.from(createHash('sha256').update(plaintext, 'utf8').digest('hex'));
    const expectedHash = Buffer.from(envelope.plaintextSha256);
    if (actualHash.length !== expectedHash.length || !timingSafeEqual(actualHash, expectedHash)) throw new Error('BACKUP_HASH_MISMATCH');
    return plaintext;
  } catch (error) {
    if (error instanceof Error && error.message === 'BACKUP_HASH_MISMATCH') throw error;
    throw new Error('BACKUP_AUTHENTICATION_FAILED');
  }
}
