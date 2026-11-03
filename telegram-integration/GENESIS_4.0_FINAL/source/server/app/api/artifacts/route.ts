import { NextRequest, NextResponse } from 'next/server';
import { requireSameOrigin } from '@/lib/request-security';
import { apiUser, jsonError } from '@/lib/auth';
import { db } from '@/lib/db';
import { artifactSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const params = new URL(req.url).searchParams;
  const id = params.get('id');
  if (id) {
    const artifact = await db.artifact.findFirst({ where: { id, userId: user.id }, include: { source: true, project: { select: { id: true, title: true } }, provenanceEvents: { orderBy: { createdAt: 'desc' }, take: 30 } } });
    return artifact ? NextResponse.json({ artifact }, { headers: { 'Cache-Control': 'no-store' } }) : jsonError('Материал не найден.', 404);
  }
  const projectId = params.get('projectId');
  const artifacts = await db.artifact.findMany({
    where: { userId: user.id, status: 'active', ...(projectId ? { projectId } : {}) },
    include: { source: { select: { id: true, title: true, trustStatus: true } }, project: { select: { id: true, title: true } } },
    orderBy: { updatedAt: 'desc' }
  });
  return NextResponse.json({ artifacts }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const originFailure = requireSameOrigin(req); if (originFailure) return originFailure;
  const user = await apiUser(req); if (!user) return jsonError('Требуется вход.', 401);
  const parsed = artifactSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError('Проверь название и тип материала.');
  if (parsed.data.projectId && !await db.project.findFirst({ where: { id: parsed.data.projectId, userId: user.id }, select: { id: true } })) return jsonError('Проект не найден.', 404);
  if (parsed.data.sourceId && !await db.source.findFirst({ where: { id: parsed.data.sourceId, userId: user.id }, select: { id: true } })) return jsonError('Источник не найден.', 404);
  const artifact = await db.$transaction(async tx => {
    const created = await tx.artifact.create({ data: { ...parsed.data, userId: user.id, storageUri: null, contentHash: null, status: 'active' } });
    await tx.provenanceEvent.create({ data: { userId: user.id, artifactId: created.id, sourceId: created.sourceId, eventType: 'ARTIFACT_REGISTERED', details: { mediaType: created.mediaType, contentBytesStored: false } } });
    return created;
  });
  await db.auditEvent.create({ data: { userId: user.id, event: 'ARTIFACT_REGISTERED', metadata: { artifactId: artifact.id } } });
  return NextResponse.json({ artifact }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  const originFailure = requireSameOrigin(req); if (originFailure) return originFailure;
  const user = await apiUser(req); if (!user) return jsonError('Требуется вход.', 401);
  const body = await req.json(); if (typeof body.id !== 'string') return jsonError('Не указан материал.');
  const parsed = artifactSchema.partial().safeParse(body);
  const status = body.status === 'active' || body.status === 'archived' ? body.status : undefined;
  if (!parsed.success || (!Object.keys(parsed.data).length && !status)) return jsonError('Нет допустимых изменений.');
  const existing = await db.artifact.findFirst({ where: { id: body.id, userId: user.id }, select: { id: true } });
  if (!existing) return jsonError('Материал не найден.', 404);
  if (parsed.data.projectId && !await db.project.findFirst({ where: { id: parsed.data.projectId, userId: user.id }, select: { id: true } })) return jsonError('Проект не найден.', 404);
  if (parsed.data.sourceId && !await db.source.findFirst({ where: { id: parsed.data.sourceId, userId: user.id }, select: { id: true } })) return jsonError('Источник не найден.', 404);
  const artifact = await db.artifact.update({ where: { id: existing.id }, data: { ...parsed.data, ...(status ? { status } : {}), version: { increment: 1 } } });
  await db.provenanceEvent.create({ data: { userId: user.id, artifactId: artifact.id, sourceId: artifact.sourceId, eventType: status === 'archived' ? 'ARTIFACT_ARCHIVED' : 'ARTIFACT_UPDATED', details: { version: artifact.version } } });
  await db.auditEvent.create({ data: { userId: user.id, event: status === 'archived' ? 'ARTIFACT_ARCHIVED' : 'ARTIFACT_UPDATED', metadata: { artifactId: artifact.id, version: artifact.version } } });
  return NextResponse.json({ artifact }, { headers: { 'Cache-Control': 'no-store' } });
}
