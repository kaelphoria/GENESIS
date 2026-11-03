import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

function clientIdentifier(req: NextRequest): string {
  // The deployment proxy must overwrite these headers; do not expose the app directly.
  const trusted = req.headers.get('x-real-ip')
    || req.headers.get('cf-connecting-ip')
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return trusted || 'unknown-client';
}

export async function enforceRateLimit(
  req: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
  subject?: string
): Promise<RateLimitResult> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('RATE_LIMIT_SECRET_NOT_CONFIGURED');
  const identity = subject || clientIdentifier(req);
  const keyHash = createHmac('sha256', secret).update(`${scope}:${identity}`).digest('hex');
  const rows = await db.$queryRaw<Array<{ count: number; windowStartedAt: Date }>>`
    INSERT INTO "RateLimitBucket" ("keyHash", "count", "windowStartedAt", "updatedAt")
    VALUES (${keyHash}, 1, NOW(), NOW())
    ON CONFLICT ("keyHash") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."windowStartedAt" <= NOW() - make_interval(secs => ${windowMs / 1000}::double precision) THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "windowStartedAt" = CASE
        WHEN "RateLimitBucket"."windowStartedAt" <= NOW() - make_interval(secs => ${windowMs / 1000}::double precision) THEN NOW()
        ELSE "RateLimitBucket"."windowStartedAt"
      END,
      "updatedAt" = NOW()
    RETURNING "count", "windowStartedAt"
  `;
  const current = rows[0];
  if (!current) throw new Error('RATE_LIMIT_STORAGE_UNAVAILABLE');
  const elapsed = Date.now() - new Date(current.windowStartedAt).getTime();
  const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - elapsed) / 1000));
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds
  };
}
