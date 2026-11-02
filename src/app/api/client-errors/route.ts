import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuth, CORS_HEADERS } from '@/lib/auth';
import { getClientIp, rateLimit } from '@/lib/rateLimit';
import { createLog } from '@/lib/logger';

const schema = z.object({
  message: z.string().max(500),
  stack: z.string().max(4000).optional(),
  isFatal: z.boolean().optional(),
  platform: z.string().max(20).optional(),
  appVersion: z.string().max(20).optional(),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// POST /api/client-errors — a mobilalkalmazás hibáinak naplózása (az admin naplóban látszik).
// Bejelentkezés nélkül is fogad (indulási összeomlás), ezért szigorú rate limit és méretkorlát van.
export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`client-error:${getClientIp(req)}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: CORS_HEADERS });
    }
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400, headers: CORS_HEADERS });

    const { message, stack, isFatal, platform, appVersion } = parsed.data;
    const auth = verifyAuth(req);
    await createLog('error', 'Mobil', `${isFatal ? '[FATAL] ' : ''}${message}`, {
      stack,
      platform,
      appVersion,
      userId: auth?.userId,
    });
    return NextResponse.json({ success: true }, { status: 202, headers: CORS_HEADERS });
  } catch (error) {
    console.error('POST /api/client-errors error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
