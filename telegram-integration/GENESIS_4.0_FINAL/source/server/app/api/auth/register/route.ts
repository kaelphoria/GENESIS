import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await enforceRateLimit(
      req,
      'auth-register',
      3,
      3600000
    );

    if (rateLimitResponse) return rateLimitResponse;

    const bootstrapToken = req.headers.get('x-genesis-bootstrap-token');
    const expectedToken = process.env.GENESIS_BOOTSTRAP_TOKEN;

    if (!expectedToken || expectedToken.length < 32) {
      return NextResponse.json(
        { error: 'Server bootstrap configuration is invalid.' },
        { status: 500 }
      );
    }

    if (!bootstrapToken || bootstrapToken !== expectedToken) {
      return NextResponse.json(
        { error: 'A valid bootstrap token is required to create a private space.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must contain at least 8 characters.' },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 12);

    // A transaction-scoped advisory lock prevents simultaneous first-owner registrations.
    const result = await db.$transaction(async tx => {
      // FIX: cast the PostgreSQL void result to text so Prisma can deserialize it.
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(721946203)::text AS lock_acquired
      `;

      if (await tx.user.count() > 0) {
        return { kind: 'initialized' as const };
      }

      if (
        await tx.user.findUnique({
          where: { email },
          select: { id: true }
        })
      ) {
        return { kind: 'exists' as const };
      }

      const user = await tx.user.create({
        data: { email, passwordHash }
      });

      return { kind: 'created' as const, user };
    });

    if (result.kind === 'initialized') {
      return NextResponse.json(
        { error: 'Private space has already been initialized.' },
        { status: 409 }
      );
    }

    if (result.kind === 'exists') {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[GENESIS REGISTER ERROR]', error);

    return NextResponse.json(
      { error: 'Unable to create account. Please check server configuration.' },
      { status: 500 }
    );
  }
}
