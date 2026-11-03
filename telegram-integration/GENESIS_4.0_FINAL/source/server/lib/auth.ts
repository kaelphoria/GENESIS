import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
const COOKIE = 'genesis_session';
function secret() { const s = process.env.AUTH_SECRET; if (!s || s.length < 32) throw new Error('AUTH_SECRET must contain at least 32 characters'); return new TextEncoder().encode(s); }
export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret());
  const jar = await cookies(); jar.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
}
export async function destroySession() { const jar = await cookies(); jar.delete(COOKIE); }
export async function getUser() {
  try { const token = (await cookies()).get(COOKIE)?.value; if (!token) return null; const { payload } = await jwtVerify(token, secret()); if (!payload.sub) return null; return await db.user.findUnique({ where: { id: String(payload.sub) }, select: { id:true, email:true, createdAt:true } }); } catch { return null; }
}
export async function apiUser(req: NextRequest) {
  try { const token = req.cookies.get(COOKIE)?.value; if (!token) return null; const { payload } = await jwtVerify(token, secret()); if (!payload.sub) return null; return await db.user.findUnique({ where:{id:String(payload.sub)}, select:{id:true,email:true} }); } catch { return null; }
}
export function jsonError(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }
