import { NextRequest, NextResponse } from 'next/server';
import { originAllowed } from '@/lib/origin-policy.mjs';

/**
 * Reject cross-origin or origin-less browser mutations.
 * Configure GENESIS_APP_ORIGIN behind reverse proxies for a stable canonical origin.
 */
export function requireSameOrigin(req: NextRequest): NextResponse | null {
  const supplied = req.headers.get('origin') || req.headers.get('referer');
  const expected = process.env.GENESIS_APP_ORIGIN || req.nextUrl.origin;

  if (!originAllowed(supplied, expected)) {
    return NextResponse.json(
      { error: 'Запрос отклонён: источник отсутствует, некорректен или не совпадает с GENESIS.' },
      { status: 403, headers: { 'Cache-Control': 'no-store', Vary: 'Origin' } }
    );
  }

  return null;
}
