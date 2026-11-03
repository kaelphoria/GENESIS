import { NextRequest, NextResponse } from 'next/server';
import { requireSameOrigin } from '@/lib/request-security';
import { apiUser, jsonError } from '@/lib/auth';
import { db } from '@/lib/db';
import { milestoneSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const projectId = new URL(req.url).searchParams.get('projectId');
  if (projectId && !await db.project.findFirst({ where: { id: projectId, userId: user.id }, select: { id: true } })) return jsonError('Проект не найден.', 404);
  const milestones = await db.milestone.findMany({ where: { userId: user.id, ...(projectId ? { projectId } : {}) }, orderBy: [{ sortOrder: 'asc' }, { dueAt: 'asc' }] });
  return NextResponse.json({ milestones }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const originFailure = requireSameOrigin(req);
  if (originFailure) return originFailure;
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const parsed = milestoneSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError('Проверь параметры этапа.');
  const project = await db.project.findFirst({ where: { id: parsed.data.projectId, userId: user.id }, select: { id: true } });
  if (!project) return jsonError('Проект не найден.', 404);
  const milestone = await db.milestone.create({ data: { ...parsed.data, userId: user.id, dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null } });
  await db.auditEvent.create({ data: { userId: user.id, event: 'MILESTONE_CREATED', metadata: { milestoneId: milestone.id, projectId: project.id } } });
  return NextResponse.json({ milestone }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  const originFailure = requireSameOrigin(req);
  if (originFailure) return originFailure;
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const body = await req.json();
  if (typeof body.id !== 'string') return jsonError('Не указан этап.');
  const parsed = milestoneSchema.omit({ projectId: true }).partial().safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) return jsonError('Нет допустимых изменений.');
  const existing = await db.milestone.findFirst({ where: { id: body.id, userId: user.id }, select: { id: true } });
  if (!existing) return jsonError('Этап не найден.', 404);
  const data = { ...parsed.data, ...(parsed.data.dueAt !== undefined ? { dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null } : {}) };
  const milestone = await db.milestone.update({ where: { id: existing.id }, data });
  await db.auditEvent.create({ data: { userId: user.id, event: 'MILESTONE_UPDATED', metadata: { milestoneId: milestone.id } } });
  return NextResponse.json({ milestone }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(req: NextRequest) {
  const originFailure = requireSameOrigin(req);
  if (originFailure) return originFailure;
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return jsonError('Не указан этап.');
  const result = await db.milestone.deleteMany({ where: { id, userId: user.id } });
  return result.count ? NextResponse.json({ ok: true }) : jsonError('Этап не найден.', 404);
}
