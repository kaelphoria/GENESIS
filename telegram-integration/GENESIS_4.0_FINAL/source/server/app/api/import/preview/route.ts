import { NextRequest, NextResponse } from 'next/server';
import { requireSameOrigin } from '@/lib/request-security';
import { apiUser, jsonError } from '@/lib/auth';
import { analyzeAccountExport } from '@/lib/continuity/import-preview.mjs';
import { createHash } from 'node:crypto';
import { createImportPreviewReceipt } from '@/lib/continuity/import-receipt.mjs';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

async function readLimitedText(req: NextRequest, maxBytes: number): Promise<string> {
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new Error('IMPORT_TOO_LARGE');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export async function POST(req: NextRequest) {
  const originFailure = requireSameOrigin(req);
  if (originFailure) return originFailure;
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  try {
    const rate = await enforceRateLimit(req, 'account-import-preview', 8, 60_000, user.id);
    if (!rate.allowed) return NextResponse.json({ error: 'Слишком много проверок импорта. Сделай паузу.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds), 'Cache-Control': 'no-store' } });
  } catch { return jsonError('Сервис защиты временно недоступен.', 503); }
  const declaredLength = Number(req.headers.get('content-length') || 0);
  if (declaredLength > MAX_IMPORT_BYTES) return jsonError('Файл импорта превышает лимит 10 МБ.', 413);
  try {
    const raw = await readLimitedText(req, MAX_IMPORT_BYTES);
    const payload = JSON.parse(raw);
    const preview = analyzeAccountExport(payload);
    const payloadHash = createHash('sha256').update(raw).digest('hex');
    const receipt = preview.valid ? createImportPreviewReceipt({ userId: user.id, payloadHash, schemaVersion: preview.schemaVersion as number }, process.env.AUTH_SECRET || '') : null;
    if (receipt) {
      const claims = JSON.parse(Buffer.from(receipt.split('.')[0], 'base64url').toString('utf8'));
      await db.importPreviewReceipt.create({ data: { userId: user.id, nonce: claims.nonce, payloadHash, schemaVersion: claims.schemaVersion, expiresAt: new Date(claims.expiresAt) } });
      await db.auditEvent.create({ data: { userId: user.id, event: 'IMPORT_PREVIEW_CREATED', metadata: { schemaVersion: claims.schemaVersion, payloadHash, receiptNonce: claims.nonce } } });
    }
    return NextResponse.json({ preview, receipt, receiptExpiresInSeconds: receipt ? 600 : null }, { status: preview.valid ? 200 : 422, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && error.message === 'IMPORT_TOO_LARGE') return jsonError('Файл импорта превышает лимит 10 МБ.', 413);
    if (error instanceof TypeError) return jsonError('Файл импорта должен содержать корректный UTF-8 текст.', 400);
    return jsonError('Не удалось прочитать JSON-файл импорта.', 400);
  }
}
