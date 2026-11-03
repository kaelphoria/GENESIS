import { NextRequest, NextResponse } from 'next/server';
import { requireSameOrigin } from '@/lib/request-security';
import { apiUser, jsonError } from '@/lib/auth';
import { db } from '@/lib/db';
import { projectSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const projects = await db.project.findMany({
    where: { userId: user.id }, orderBy: { updatedAt: 'desc' },
    include: { goal: { select: { id: true, title: true } }, milestones: { orderBy: { sortOrder: 'asc' } }, _count: { select: { actions: true, decisions: true, artifacts: true } } }
  });
  return NextResponse.json({ projects }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const originFailure = requireSameOrigin(req);
  if (originFailure) return originFailure;
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const parsed = projectSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError('Проверь название и параметры проекта.');
  if (parsed.data.goalId && !await db.goal.findFirst({ where: { id: parsed.data.goalId, userId: user.id }, select: { id: true } })) return jsonError('Цель не найдена.', 404);
  const project = await db.project.create({ data: {
    ...parsed.data, userId: user.id,
    startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : null,
    targetAt: parsed.data.targetAt ? new Date(parsed.data.targetAt) : null
  } });
  await db.auditEvent.create({ data: { userId: user.id, event: 'PROJECT_CREATED', metadata: { projectId: project.id } } });
  return NextResponse.json({ project }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  const originFailure = requireSameOrigin(req);
  if (originFailure) return originFailure;
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const body = await req.json();
  if (typeof body.id !== 'string') return jsonError('Не указан проект.');
  const parsed = projectSchema.partial().safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) return jsonError('Нет допустимых изменений.');
  const existing = await db.project.findFirst({ where: { id: body.id, userId: user.id }, select: { id: true } });
  if (!existing) return jsonError('Проект не найден.', 404);
  if (parsed.data.goalId && !await db.goal.findFirst({ where: { id: parsed.data.goalId, userId: user.id }, select: { id: true } })) return jsonError('Цель не найдена.', 404);
  const data = { ...parsed.data,
    ...(parsed.data.startAt !== undefined ? { startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : null } : {}),
    ...(parsed.data.targetAt !== undefined ? { targetAt: parsed.data.targetAt ? new Date(parsed.data.targetAt) : null } : {})
  };
  const project = await db.project.update({ where: { id: existing.id }, data });
  await db.auditEvent.create({ data: { userId: user.id, event: 'PROJECT_UPDATED', metadata: { projectId: project.id } } });
  return NextResponse.json({ project }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(req: NextRequest) {
  const originFailure = requireSameOrigin(req);
  if (originFailure) return originFailure;
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return jsonError('Не указан проект.');
  const result = await db.project.deleteMany({ where: { id, userId: user.id } });
  if (!result.count) return jsonError('Проект не найден.', 404);
  await db.auditEvent.create({ data: { userId: user.id, event: 'PROJECT_DELETED', metadata: { projectId: id } } });
  return NextResponse.json({ ok: true });
}
