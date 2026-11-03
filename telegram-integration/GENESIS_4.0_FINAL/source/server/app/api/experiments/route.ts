import { NextRequest, NextResponse } from 'next/server';
import { requireSameOrigin } from '@/lib/request-security';
import { apiUser, jsonError } from '@/lib/auth';
import { db } from '@/lib/db';
import { experimentSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const user = await apiUser(req); if (!user) return jsonError('Требуется вход.', 401);
  const experiments = await db.experiment.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json({ experiments }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(req: NextRequest) {
  const originFailure = requireSameOrigin(req); if (originFailure) return originFailure;
  const user = await apiUser(req); if (!user) return jsonError('Требуется вход.', 401);
  const parsed = experimentSchema.safeParse(await req.json()); if (!parsed.success) return jsonError('Проверь параметры эксперимента.');
  if (parsed.data.decisionId && !await db.decision.findFirst({ where: { id: parsed.data.decisionId, userId: user.id }, select: { id: true } })) return jsonError('Решение не найдено.', 404);
  const experiment = await db.experiment.create({ data: { ...parsed.data, userId: user.id, startedAt: parsed.data.startedAt ? new Date(parsed.data.startedAt) : null, completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : null } });
  await db.auditEvent.create({ data: { userId: user.id, event: 'EXPERIMENT_CREATED', metadata: { experimentId: experiment.id } } });
  return NextResponse.json({ experiment }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
export async function PATCH(req: NextRequest) {
  const originFailure = requireSameOrigin(req); if (originFailure) return originFailure;
  const user = await apiUser(req); if (!user) return jsonError('Требуется вход.', 401);
  const body = await req.json(); if (typeof body.id !== 'string') return jsonError('Не указан эксперимент.');
  const parsed = experimentSchema.partial().safeParse(body); if (!parsed.success || !Object.keys(parsed.data).length) return jsonError('Нет допустимых изменений.');
  const existing = await db.experiment.findFirst({ where: { id: body.id, userId: user.id }, select: { id: true } }); if (!existing) return jsonError('Эксперимент не найден.', 404);
  if (parsed.data.decisionId && !await db.decision.findFirst({ where: { id: parsed.data.decisionId, userId: user.id }, select: { id: true } })) return jsonError('Решение не найдено.', 404);
  const data = { ...parsed.data, ...(parsed.data.startedAt !== undefined ? { startedAt: parsed.data.startedAt ? new Date(parsed.data.startedAt) : null } : {}), ...(parsed.data.completedAt !== undefined ? { completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : null } : {}) };
  const experiment = await db.experiment.update({ where: { id: existing.id }, data });
  await db.auditEvent.create({ data: { userId: user.id, event: 'EXPERIMENT_UPDATED', metadata: { experimentId: experiment.id } } });
  return NextResponse.json({ experiment }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function DELETE(req: NextRequest) {
  const originFailure = requireSameOrigin(req); if (originFailure) return originFailure;
  const user = await apiUser(req); if (!user) return jsonError('Требуется вход.', 401);
  const id = new URL(req.url).searchParams.get('id'); if (!id) return jsonError('Не указан эксперимент.');
  const result = await db.experiment.deleteMany({ where: { id, userId: user.id } });
  return result.count ? NextResponse.json({ ok: true }) : jsonError('Эксперимент не найден.', 404);
}
