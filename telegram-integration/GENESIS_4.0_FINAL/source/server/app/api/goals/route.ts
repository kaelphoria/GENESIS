import { NextRequest, NextResponse } from 'next/server';
import { requireSameOrigin } from '@/lib/request-security';
import { apiUser, jsonError } from '@/lib/auth';
import { db } from '@/lib/db';
import { goalSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const goals = await db.goal.findMany({
    where: { userId: user.id }, orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    include: { world: { select: { id: true, title: true, slug: true } }, _count: { select: { projects: true, actions: true, decisions: true, lifeEvents: true } } }
  });
  return NextResponse.json({ goals }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const originFailure = requireSameOrigin(req); if (originFailure) return originFailure;
  const user = await apiUser(req); if (!user) return jsonError('Требуется вход.', 401);
  const parsed = goalSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError('Проверь название и параметры цели.');
  if (parsed.data.worldId && !await db.world.findFirst({ where: { id: parsed.data.worldId, userId: user.id }, select: { id: true } })) return jsonError('Мир не найден.', 404);
  const goal = await db.goal.create({ data: { ...parsed.data, userId: user.id, targetAt: parsed.data.targetAt ? new Date(parsed.data.targetAt) : null } });
  await db.auditEvent.create({ data: { userId: user.id, event: 'GOAL_CREATED', metadata: { goalId: goal.id, worldId: goal.worldId } } });
  return NextResponse.json({ goal }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  const originFailure = requireSameOrigin(req); if (originFailure) return originFailure;
  const user = await apiUser(req); if (!user) return jsonError('Требуется вход.', 401);
  const body = await req.json(); if (typeof body.id !== 'string') return jsonError('Не указана цель.');
  const parsed = goalSchema.partial().safeParse(body);
  if (!parsed.success || !Object.keys(parsed.data).length) return jsonError('Нет допустимых изменений.');
  const existing = await db.goal.findFirst({ where: { id: body.id, userId: user.id }, select: { id: true } });
  if (!existing) return jsonError('Цель не найдена.', 404);
  if (parsed.data.worldId && !await db.world.findFirst({ where: { id: parsed.data.worldId, userId: user.id }, select: { id: true } })) return jsonError('Мир не найден.', 404);
  const goal = await db.goal.update({ where: { id: existing.id }, data: { ...parsed.data, ...(parsed.data.targetAt !== undefined ? { targetAt: parsed.data.targetAt ? new Date(parsed.data.targetAt) : null } : {}) } });
  await db.auditEvent.create({ data: { userId: user.id, event: 'GOAL_UPDATED', metadata: { goalId: goal.id } } });
  return NextResponse.json({ goal }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(req: NextRequest) {
  const originFailure = requireSameOrigin(req); if (originFailure) return originFailure;
  const user = await apiUser(req); if (!user) return jsonError('Требуется вход.', 401);
  const id = new URL(req.url).searchParams.get('id'); if (!id) return jsonError('Не указана цель.');
  const result = await db.goal.deleteMany({ where: { id, userId: user.id } });
  if (!result.count) return jsonError('Цель не найдена.', 404);
  await db.auditEvent.create({ data: { userId: user.id, event: 'GOAL_DELETED', metadata: { goalId: id } } });
  return NextResponse.json({ ok: true });
}
