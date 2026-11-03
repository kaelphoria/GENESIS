import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

function signature(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createImportPreviewReceipt({ userId, payloadHash, schemaVersion, ttlMs = 10 * 60 * 1000 }, secret) {
  if (typeof secret !== 'string' || secret.length < 32) return null;
  if (typeof userId !== 'string' || !userId || !/^[a-f0-9]{64}$/i.test(payloadHash || '') || !Number.isInteger(schemaVersion) || schemaVersion < 1) return null;
  if (!Number.isInteger(ttlMs) || ttlMs < 1000 || ttlMs > 15 * 60 * 1000) return null;
  const claims = { userId, payloadHash: payloadHash.toLowerCase(), schemaVersion, expiresAt: Date.now() + ttlMs, nonce: randomUUID() };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyImportPreviewReceipt(receipt, { userId, payloadHash }, secret, now = Date.now()) {
  if (typeof secret !== 'string' || secret.length < 32 || typeof receipt !== 'string' || receipt.length > 4096) return null;
  const parts = receipt.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) return null;
  const expected = Buffer.from(signature(parts[0], secret));
  const provided = Buffer.from(parts[1]);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;
  try {
    const claims = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (claims.userId !== userId || claims.payloadHash !== String(payloadHash || '').toLowerCase() || !Number.isInteger(claims.schemaVersion) || claims.schemaVersion < 1 || !Number.isInteger(claims.expiresAt) || claims.expiresAt <= now || typeof claims.nonce !== 'string' || claims.nonce.length < 16) return null;
    return claims;
  } catch { return null; }
}

/** Consume a previously persisted receipt inside the same transaction as the future import apply. */
export async function consumeImportPreviewReceipt(tx, receipt, expected, secret, now = new Date()) {
  const claims = verifyImportPreviewReceipt(receipt, expected, secret, now.getTime());
  if (!claims) return { ok: false, reason: 'INVALID_OR_EXPIRED_RECEIPT' };
  const result = await tx.importPreviewReceipt.updateMany({
    where: { nonce: claims.nonce, userId: claims.userId, payloadHash: claims.payloadHash, schemaVersion: claims.schemaVersion, expiresAt: { gt: now }, consumedAt: null },
    data: { consumedAt: now }
  });
  return result.count === 1 ? { ok: true, claims } : { ok: false, reason: 'RECEIPT_ALREADY_USED_OR_UNKNOWN' };
}
