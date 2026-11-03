import { NextRequest, NextResponse } from 'next/server';
import { requireSameOrigin } from '@/lib/request-security';
import { apiUser, jsonError } from '@/lib/auth';
import { db } from '@/lib/db';
import { sourceSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const sources = await db.source.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ sources }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const originFailure = requireSameOrigin(req);
  if (originFailure) return originFailure;
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const parsed = sourceSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError('Проверь тип, название и ссылку источника.');
  const source = await db.source.create({ data: { ...parsed.data, userId: user.id, trustStatus: 'unverified' } });
  await db.provenanceEvent.create({ data: { userId: user.id, sourceId: source.id, eventType: 'SOURCE_REGISTERED', details: { kind: source.kind, trustStatus: source.trustStatus } } });
  await db.auditEvent.create({ data: { userId: user.id, event: 'SOURCE_REGISTERED', metadata: { sourceId: source.id, kind: source.kind } } });
  return NextResponse.json({ source }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
