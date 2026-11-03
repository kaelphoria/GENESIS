import { requireSameOrigin } from '@/lib/request-security';
import { NextRequest, NextResponse } from 'next/server';
import { apiUser, jsonError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  const id = new URL(req.url).searchParams.get('id');

  if (id) {
    const conversation = await db.conversation.findFirst({
      where: { id, userId: user.id },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 200 } }
    });
    if (!conversation) return jsonError('Диалог не найден.', 404);
    return NextResponse.json({ conversation }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const conversations = await db.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: { id: true, title: true, createdAt: true, updatedAt: true, _count: { select: { messages: true } } }
  });
  return NextResponse.json({ conversations }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const originFailure = requireSameOrigin(req);
  if (originFailure) return originFailure;
  const user = await apiUser(req);
  if (!user) return jsonError('Требуется вход.', 401);
  try {
    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 100) : '';
    const conversation = await db.conversation.create({
      data: { userId: user.id, title: title || 'Новый диалог' }
    });
    await db.auditEvent.create({
      data: { userId: user.id, event: 'CONVERSATION_CREATED', metadata: { conversationId: conversation.id } }
    });
    return NextResponse.json({ conversation }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GENESIS conversation create error', error);
    return jsonError('Не удалось создать диалог.', 500);
  }
}
