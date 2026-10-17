import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { CORS_HEADERS } from '@/lib/auth';
import { revokeRefreshToken } from '@/lib/tokens';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// POST /api/auth/logout — visszavonja az eszköz refresh tokenjét (idempotens).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.refreshToken === 'string' && body.refreshToken.length >= 20) {
      await connectToDatabase();
      await revokeRefreshToken(body.refreshToken);
    }
    return NextResponse.json({ success: true }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('[auth/logout] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
