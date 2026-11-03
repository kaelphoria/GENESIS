import { requireSameOrigin } from '@/lib/request-security';
import { NextRequest, NextResponse } from 'next/server';
import { apiUser, jsonError } from '@/lib/auth';
import { db } from '@/lib/db';
import { memorySchema } from '@/lib/validators';
import { refreshMemoryEmbedding } from '@/lib/memory-embeddings';

function memorySnapshot(memory: { title: string; content: string; classification: string; source: string; sourceRefId: string | null; confidence: number | null; status: string; contextPermission: string; version: number }) {
  return {
    title: memory.title, content: memory.content, classification: memory.classification,
    source: memory.source, sourceRefId: memory.sourceRefId, confidence: memory.confidence,
    status: memory.status, contextPermission: memory.contextPermission, version: memory.version
  };
}

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return jsonError('Не указана запись.');
  const memory = await db.memoryRecord.findFirst({
    where: { id, userId: user.id },
    include: {
      versions: { orderBy: { version: 'desc' }, take: 30, select: { id: true, version: true, snapshot: true, createdAt: true } },
      provenanceEvents: { orderBy: { createdAt: 'desc' }, take: 30 },
      sourceRef: true
    }
  });
  return memory ? NextResponse.json({ memory }, { headers: { 'Cache-Control': 'no-store' } }) : jsonError('Запись не найдена.', 404);
}

export async function POST(req: NextRequest) {
  const originFailure = requireSameOrigin(req);
  if (originFailure) return originFailure;
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);

  try {
    const parsed = memorySchema.safeParse(await req.json());
    if (!parsed.success) return jsonError('Проверь заголовок и содержание.');
    if (parsed.data.worldId && !await db.world.findFirst({ where: { id: parsed.data.worldId, userId: user.id }, select: { id: true } })) return jsonError('Мир не найден.', 404);
    if (parsed.data.sourceRefId && !await db.source.findFirst({ where: { id: parsed.data.sourceRefId, userId: user.id }, select: { id: true } })) return jsonError('Источник не найден.', 404);

    const memory = await db.$transaction(async tx => {
      const created = await tx.memoryRecord.create({ data: { ...parsed.data, userId: user.id, version: 1 } });
      await tx.memoryVersion.create({ data: { userId: user.id, memoryId: created.id, version: 1, snapshot: memorySnapshot(created) } });
      await tx.provenanceEvent.create({ data: { userId: user.id, memoryId: created.id, sourceId: created.sourceRefId, eventType: 'MEMORY_CREATED', details: { version: 1, classification: created.classification } } });
      return created;
    });
    await refreshMemoryEmbedding(memory);
    await db.auditEvent.create({ data: { userId: user.id, event: 'MEMORY_CREATED', metadata: { memoryId: memory.id, classification: memory.classification, version: 1 } } });
    const updated = await db.memoryRecord.findFirst({ where: { id: memory.id, userId: user.id } });
    return NextResponse.json({ memory: updated }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GENESIS memory create error', error);
    return jsonError('Не удалось сохранить запись памяти.', 500);
  }
}

export async function PATCH(req: NextRequest) {
  const originFailure = requireSameOrigin(req);
  if (originFailure) return originFailure;
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);

  try {
    const body = await req.json();
    if (typeof body.id !== 'string') return jsonError('Не указана запись.');
    const existing = await db.memoryRecord.findFirst({ where: { id: body.id, userId: user.id } });
    if (!existing) return jsonError('Запись не найдена.', 404);
    if (Number.isInteger(body.version) && body.version !== existing.version) return jsonError('Запись изменилась в другой сессии. Обнови её перед повторным сохранением.', 409);

    const data: { title?: string; content?: string; status?: string; contextPermission?: string; sourceRefId?: string | null } = {};
    if (typeof body.title === 'string') data.title = body.title.trim().slice(0, 180);
    if (typeof body.content === 'string') data.content = body.content.trim().slice(0, 12000);
    if (body.status === 'archived' || body.status === 'active') data.status = body.status;
    if (body.contextPermission === 'granted' || body.contextPermission === 'denied') data.contextPermission = body.contextPermission;
    if (typeof body.sourceRefId === 'string' || body.sourceRefId === null) data.sourceRefId = body.sourceRefId;
    if (Object.keys(data).length === 0) return jsonError('Нет допустимых изменений.');
    if (data.sourceRefId && !await db.source.findFirst({ where: { id: data.sourceRefId, userId: user.id }, select: { id: true } })) return jsonError('Источник не найден.', 404);

    const updated = await db.$transaction(async tx => {
      const changed = await tx.memoryRecord.updateMany({ where: { id: existing.id, userId: user.id, version: existing.version }, data: { ...data, version: { increment: 1 } } });
      if (changed.count !== 1) return null;
      const next = await tx.memoryRecord.findFirstOrThrow({ where: { id: existing.id, userId: user.id } });
      await tx.memoryVersion.create({ data: { userId: user.id, memoryId: next.id, version: next.version, snapshot: memorySnapshot(next) } });
      await tx.provenanceEvent.create({ data: {
        userId: user.id, memoryId: next.id, sourceId: next.sourceRefId,
        eventType: data.contextPermission === 'granted' ? 'MEMORY_CONTEXT_GRANTED' : data.contextPermission === 'denied' ? 'MEMORY_CONTEXT_REVOKED' : 'MEMORY_UPDATED',
        details: { version: next.version, sourceRefId: next.sourceRefId, contentChanged: next.title !== existing.title || next.content !== existing.content }
      } });
      return next;
    });
    if (!updated) return jsonError('Запись изменилась параллельно. Обнови её и повтори действие.', 409);
    const contentChanged = updated.title !== existing.title || updated.content !== existing.content;
    if (contentChanged) await refreshMemoryEmbedding(updated);
    await db.auditEvent.create({ data: { userId: user.id, event: 'MEMORY_UPDATED', metadata: {
      memoryId: updated.id, version: updated.version, contentChanged,
      contextPermissionChanged: existing.contextPermission !== updated.contextPermission,
      contextPermission: updated.contextPermission
    } } });
    const result = await db.memoryRecord.findFirst({ where: { id: updated.id, userId: user.id } });
    return NextResponse.json({ ok: true, memory: result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GENESIS memory update error', error);
    return jsonError('Не удалось обновить запись памяти.', 500);
  }
}

export async function DELETE(req: NextRequest) {
  const originFailure = requireSameOrigin(req);
  if (originFailure) return originFailure;
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return jsonError('Не указана запись.');
  const result = await db.memoryRecord.deleteMany({ where: { id, userId: user.id } });
  return result.count ? NextResponse.json({ ok: true }) : jsonError('Запись не найдена.', 404);
}
