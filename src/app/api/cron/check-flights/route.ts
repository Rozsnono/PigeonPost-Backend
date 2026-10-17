import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkFlightStatuses } from '@/lib/flightCron';

function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[cron/check-flights] CRON_SECRET nincs beállítva – a végpont le van tiltva.');
    return false;
  }
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(req.headers.get('authorization') || '');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

// GET /api/cron/check-flights — checks for arriving letters and returning pigeons, updates DB & triggers push
// Hitelesítés: `Authorization: Bearer <CRON_SECRET>` (a Vercel Cron is ezt küldi).
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await checkFlightStatuses();
  if ('error' in result) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result, { status: 200 });
}
