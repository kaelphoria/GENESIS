import { NextRequest, NextResponse } from 'next/server';
import { requireSameOrigin } from '@/lib/request-security';
import { apiUser, jsonError } from '@/lib/auth';
import { db } from '@/lib/db';
import { lifeEventSchema } from '@/lib/validators';

async function validateLinks(userId: string, links: { projectId?: string | null; goalId?: string | null; decisionId?: string | null; sourceId?: string | null }) {
  if (links.projectId && !await db.project.findFirst({ where: { id: links.projectId, userId }, select: { id: true } })) return 'Проект не найден.';
  if (links.goalId && !await db.goal.findFirst({ where: { id: links.goalId, userId }, select: { id: true } })) return 'Цель не найдена.';
  if (links.decisionId && !await db.decision.findFirst({ where: { id: links.decisionId, userId }, select: { id: true } })) return 'Решение не найдено.';
  if (links.sourceId && !await db.source.findFirst({ where: { id: links.sourceId, userId }, select: { id: true } })) return 'Источник не найден.';
  return null;
}

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const id = new URL(req.url).searchParams.get('id');
  if (id) {
    const event = await db.lifeEvent.findFirst({ where: { id, userId: user.id }, include: { versions: { orderBy: { version: 'desc' }, take: 50 }, project: { select: { id: true, title: true } }, decision: { select: { id: true, question: true } }, source: { select: { id: true, title: true, trustStatus: true } }, goal: { select: { id: true, title: true } } } });
    return event ? NextResponse.json({ event }, { headers: { 'Cache-Control': 'no-store' } }) : jsonError('Событие не найдено.', 404);
  }
  const events = await db.lifeEvent.findMany({
    where: { userId: user.id }, orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }], take: 200,
    include: { project: { select: { id: true, title: true } }, decision: { select: { id: true, question: true } }, source: { select: { id: true, title: true, trustStatus: true } }, goal: { select: { id: true, title: true } } }
  });
  return NextResponse.json({ events }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const originFailure = requireSameOrigin(req); if (originFailure) return originFailure;
  const user = await apiUser(req); if (!user) return jsonError('Требуется вход.', 401);
  const parsed = lifeEventSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError('Проверь название, дату и параметры события.');
  const linkError = await validateLinks(user.id, parsed.data); if (linkError) return jsonError(linkError, 404);
  const event = await db.$transaction(async tx => {
    const created = await tx.lifeEvent.create({ data: { ...parsed.data, userId: user.id, occurredAt: new Date(parsed.data.occurredAt), version: 1 } });
    await tx.lifeEventVersion.create({ data: { userId: user.id, eventId: created.id, version: 1, snapshot: { title: created.title, description: created.description, category: created.category, occurredAt: created.occurredAt.toISOString(), significance: created.significance, projectId: created.projectId, decisionId: created.decisionId, sourceId: created.sourceId, goalId: created.goalId, version: 1 } } });
    return created;
  });
  await db.auditEvent.create({ data: { userId: user.id, event: 'LIFE_EVENT_CREATED', metadata: { lifeEventId: event.id, category: event.category, version: 1 } } });
  return NextResponse.json({ event }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  const originFailure = requireSameOrigin(req); if (originFailure) return originFailure;
  const user = await apiUser(req); if (!user) return jsonError('Требуется вход.', 401);
  const body = await req.json();
  if (typeof body.id !== 'string' || !Number.isInteger(body.version)) return jsonError('Не указаны событие и его версия.');
  const existing = await db.lifeEvent.findFirst({ where: { id: body.id, userId: user.id } });
  if (!existing) return jsonError('Событие не найдено.', 404);
  if (body.version !== existing.version) return jsonError('Событие изменилось в другой сессии. Обнови историю перед повторным сохранением.', 409);
  const parsed = lifeEventSchema.partial().safeParse(body);
  if (!parsed.success || !Object.keys(parsed.data).length) return jsonError('Нет допустимых изменений.');
  const linkError = await validateLinks(user.id, parsed.data); if (linkError) return jsonError(linkError, 404);
  const event = await db.$transaction(async tx => {
    const changed = await tx.lifeEvent.updateMany({
      where: { id: existing.id, userId: user.id, version: existing.version },
      data: { ...parsed.data, ...(parsed.data.occurredAt ? { occurredAt: new Date(parsed.data.occurredAt) } : {}), version: { increment: 1 } }
    });
    if (changed.count !== 1) return null;
    const updated = await tx.lifeEvent.findFirstOrThrow({ where: { id: existing.id, userId: user.id } });
    await tx.lifeEventVersion.create({ data: { userId: user.id, eventId: updated.id, version: updated.version, snapshot: { title: updated.title, description: updated.description, category: updated.category, occurredAt: updated.occurredAt.toISOString(), significance: updated.significance, projectId: updated.projectId, decisionId: updated.decisionId, sourceId: updated.sourceId, goalId: updated.goalId, version: updated.version } } });
    return updated;
  });
  if (!event) return jsonError('Событие изменилось параллельно. Обнови историю.', 409);
  await db.auditEvent.create({ data: { userId: user.id, event: 'LIFE_EVENT_UPDATED', metadata: { lifeEventId: existing.id, version: event.version } } });
  return NextResponse.json({ event }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(req: NextRequest) {
  const originFailure = requireSameOrigin(req); if (originFailure) return originFailure;
  const user = await apiUser(req); if (!user) return jsonError('Требуется вход.', 401);
  const id = new URL(req.url).searchParams.get('id'); if (!id) return jsonError('Не указано событие.');
  const result = await db.lifeEvent.deleteMany({ where: { id, userId: user.id } });
  if (!result.count) return jsonError('Событие не найдено.', 404);
  await db.auditEvent.create({ data: { userId: user.id, event: 'LIFE_EVENT_DELETED', metadata: { lifeEventId: id } } });
  return NextResponse.json({ ok: true });
}
