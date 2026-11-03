import { NextRequest, NextResponse } from 'next/server';
import { apiUser, jsonError } from '@/lib/auth';
import { db } from '@/lib/db';
import { parsePricingCatalog } from '@/lib/oracle/cost-ledger.mjs';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  try {
    const staleBefore = new Date(Date.now() - 5 * 60 * 1000);
    const [pendingEmbeddings, failedEmbeddings, stalePendingRequests, failedRequests24h] = await Promise.all([
      db.memoryRecord.count({ where: { userId: user.id, embeddingStatus: 'pending', status: 'active' } }),
      db.memoryRecord.count({ where: { userId: user.id, embeddingStatus: 'failed', status: 'active' } }),
      db.chatRequest.count({ where: { userId: user.id, status: 'pending', updatedAt: { lt: staleBefore } } }),
      db.chatRequest.count({ where: { userId: user.id, status: 'failed', updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
    ]);
    const diagnostics = {
      status: stalePendingRequests || failedEmbeddings ? 'attention' : 'ok',
      aiProviderConfigured: Boolean(process.env.OPENAI_API_KEY),
      pricingCatalogConfigured: parsePricingCatalog(process.env.GENESIS_MODEL_PRICING_JSON || '').length > 0,
      memoryIndex: { pending: pendingEmbeddings, failed: failedEmbeddings },
      requestLifecycle: { stalePending: stalePendingRequests, failedLast24h: failedRequests24h },
      checkedAt: new Date().toISOString()
    };
    return NextResponse.json(diagnostics, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return jsonError('Диагностика временно недоступна.', 503);
  }
}
