import { NextRequest, NextResponse } from 'next/server';
import { requireSameOrigin } from '@/lib/request-security';
import { destroySession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const originFailure = requireSameOrigin(req);
  if (originFailure) return originFailure;
  await destroySession();
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
