import { requireSameOrigin } from '@/lib/request-security';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { credentialsSchema } from '@/lib/validators';
import { createSession, jsonError } from '@/lib/auth';
import { ensureUserWorkspace } from '@/lib/seed-user';
import { enforceRateLimit } from '@/lib/rate-limit';
export async function POST(req:NextRequest) {
 const originFailure = requireSameOrigin(req);
 if (originFailure) return originFailure;
 try { const rate = await enforceRateLimit(req, 'auth-login', 10, 900000); if (!rate.allowed) return NextResponse.json({ error: 'Слишком много попыток. Попробуй позже.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds), 'Cache-Control': 'no-store' } }); } catch { return jsonError('Сервис защиты временно недоступен.', 503); }
 try { const parsed=credentialsSchema.safeParse(await req.json()); if(!parsed.success) return jsonError('Проверь email и пароль.'); const user=await db.user.findUnique({where:{email:parsed.data.email.toLowerCase().trim()}}); if(!user || !(await bcrypt.compare(parsed.data.password,user.passwordHash))) return jsonError('Неверный email или пароль.',401); await ensureUserWorkspace(user.id); await createSession(user.id); await db.auditEvent.create({data:{userId:user.id,event:'SESSION_CREATED'}}); return NextResponse.json({ok:true}); } catch { return jsonError('Ошибка входа. Попробуй позже.',500); }
}
