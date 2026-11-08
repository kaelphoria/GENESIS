import { NextRequest, NextResponse } from 'next/server';
import { originAllowed } from '@/lib/origin-policy.mjs';

export function requireSameOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const expected = process.env.GENESIS_APP_ORIGIN || req.nextUrl.origin;

  if (origin && origin !== 'null') {
    if (originAllowed(origin, expected)) return null;
    return forbidden();
  }

  if (referer && referer !== 'null') {
    if (originAllowed(referer, expected)) return null;
    return forbidden();
  }

  try {
    const expectedUrl = new URL(expected);
    const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0].trim();
    const requestHost = (
      forwardedHost || req.headers.get('host') || req.nextUrl.host
    ).toLowerCase();

    const fetchSite = req.headers.get('sec-fetch-site');
    const notCrossSite =
      fetchSite === null ||
      fetchSite === 'same-origin' ||
      fetchSite === 'none';

    if (requestHost === expectedUrl.host.toLowerCase() && notCrossSite) {
      return null;
    }
  } catch {
    // Invalid origin or host.
  }

  return forbidden();
}

function forbidden(): NextResponse {
  return NextResponse.json(
    { error: 'Запрос отклонён: источник отсутствует, некорректен или не совпадает с GENESIS.' },
    {
      status: 403,
      headers: {
        'Cache-Control': 'no-store',
        Vary: 'Origin'
      }
    }
  );
}
