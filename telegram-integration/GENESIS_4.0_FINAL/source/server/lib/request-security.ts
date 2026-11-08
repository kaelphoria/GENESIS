import { NextRequest, NextResponse } from 'next/server';
import { originAllowed } from '@/lib/origin-policy.mjs';

export function requireSameOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const supplied = origin || referer;
  const expected = process.env.GENESIS_APP_ORIGIN || req.nextUrl.origin;

  let allowed = false;

  if (supplied) {
    allowed = originAllowed(supplied, expected);
  } else {
    try {
      const expectedUrl = new URL(expected);
      const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0].trim();
      const requestHost = (forwardedHost || req.headers.get('host') || req.nextUrl.host).toLowerCase();
      const fetchSite = req.headers.get('sec-fetch-site');
      const notCrossSite = fetchSite === null || fetchSite === 'same-origin' || fetchSite === 'none';

      allowed = requestHost === expectedUrl.host.toLowerCase() && notCrossSite;
    } catch {
      allowed = false;
    }
  }

  if (!allowed) {
    return NextResponse.json(
      { error: 'Запрос отклонён: источник отсутствует, некорректен или не совпадает с GENESIS.' },
      { status: 403, headers: { 'Cache-Control': 'no-store', Vary: 'Origin' } }
    );
  }

  return null;
}
