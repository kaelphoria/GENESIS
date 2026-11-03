import { requireSameOrigin } from '@/lib/request-security';
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { credentialsSchema } from '@/lib/validators';
import { createSession, jsonError } from '@/lib/auth';
import { ensureUserWorkspace } from '@/lib/seed-user';
import { enforceRateLimit } from '@/lib/rate-limit';

function validBootstrapToken(provided: string | null) {
  const expected = process.env.GENESIS_BOOTSTRAP_TOKEN;
  if (!expected || expected.length < 32 || !provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function POST(req: NextRequest) {
  const originFailure = requireSameOrigin(req);
  if (originFailure) return originFailure;
  try { const rate = await enforceRateLimit(req, 'auth-register', 3, 3600000); if (!rate.allowed) return NextResponse.json({ error: 'Слишком много попыток регистрации. Попробуй позже.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds), 'Cache-Control': 'no-store' } }); } catch { return jsonError('Сервис защиты временно недоступен.', 503); }
  if (!process.env.GENESIS_BOOTSTRAP_TOKEN || process.env.GENESIS_BOOTSTRAP_TOKEN.length < 32) {
    return jsonError('Первичная регистрация отключена. Настрой GENESIS_BOOTSTRAP_TOKEN в защищённых переменных сервера.', 503);
  }
  if (!validBootstrapToken(req.headers.get('x-genesis-bootstrap-token'))) {
    return jsonError('Для создания приватного пространства требуется действительный bootstrap token.', 403);
  }

  try {
    const parsed = credentialsSchema.safeParse(await req.json());
    if (!parsed.success) return jsonError('Укажи корректный email и пароль не короче 12 символов.');
    const email = parsed.data.email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    // A transaction-scoped advisory lock prevents two simultaneous first-owner registrations.
    const result = await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(721946203)`;
      if (await tx.user.count() > 0) return { kind: 'initialized' as const };
      if (await tx.user.findUnique({ where: { email }, select: { id: true } })) return { kind: 'exists' as const };
      const user = await tx.user.create({ data: { email, passwordHash } });
      return { kind: 'created' as const, user };
    });

    if (result.kind === 'initialized') {
      return jsonError('Это приватное пространство уже инициализировано. Дополнительная регистрация закрыта.', 403);
    }
    if (result.kind === 'exists') return jsonError('Аккаунт с таким email уже существует.', 409);

    await ensureUserWorkspace(result.user.id);
    await createSession(result.user.id);
    await db.auditEvent.create({ data: { userId: result.user.id, event: 'ACCOUNT_CREATED' } });
    return NextResponse.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GENESIS owner bootstrap failed', error);
    return jsonError('Не удалось создать аккаунт. Проверь настройки сервера.', 500);
  }
}
