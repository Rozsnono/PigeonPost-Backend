import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import { CORS_HEADERS } from '@/lib/auth';
import { getClientIp, rateLimit } from '@/lib/rateLimit';
import { findUserByRefreshToken, issueRefreshToken, signAccessToken } from '@/lib/tokens';

const refreshSchema = z.object({ refreshToken: z.string().min(20).max(200) });

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// POST /api/auth/refresh — új access tokent (és rotált refresh tokent) ad érvényes refresh tokenért.
// 401: a refresh token érvénytelen/lejárt → a kliensnek újra be kell léptetnie a felhasználót.
export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`refresh:${getClientIp(req)}`, 60, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Túl sok kérés.' }, { status: 429, headers: CORS_HEADERS });
    }
    const validation = refreshSchema.safeParse(await req.json().catch(() => null));
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400, headers: CORS_HEADERS });
    }

    await connectToDatabase();
    const { refreshToken } = validation.data;
    const user = await findUserByRefreshToken(refreshToken);
    if (!user) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401, headers: CORS_HEADERS });
    }
    if ((user as { status?: string }).status === 'banned') {
      return NextResponse.json({ error: 'Account is banned' }, { status: 403, headers: CORS_HEADERS });
    }

    const token = signAccessToken(user);
    const newRefreshToken = await issueRefreshToken(String(user._id), refreshToken);

    return NextResponse.json(
      { token, refreshToken: newRefreshToken },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('[auth/refresh] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
