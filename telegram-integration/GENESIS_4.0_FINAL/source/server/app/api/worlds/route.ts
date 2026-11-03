import { requireSameOrigin } from '@/lib/request-security';
import { NextRequest, NextResponse } from 'next/server';
import { apiUser, jsonError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const worlds = await db.world.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' }, select: { id: true, slug: true, title: true, intention: true } });
  return NextResponse.json({ worlds }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  const originFailure = requireSameOrigin(req); if (originFailure) return originFailure;
  const user = await apiUser(req); if (!user) return jsonError('Требуется вход.', 401);
  try {
    const body = await req.json();
    if (typeof body.slug !== 'string' || typeof body.intention !== 'string' || body.intention.length > 5000) return jsonError('Некорректные данные.');
    const world = await db.world.updateMany({ where: { userId: user.id, slug: body.slug }, data: { intention: body.intention } });
    if (!world.count) return jsonError('Мир не найден.', 404);
    return NextResponse.json({ ok: true });
  } catch { return jsonError('Не удалось сохранить намерение.', 500); }
}
