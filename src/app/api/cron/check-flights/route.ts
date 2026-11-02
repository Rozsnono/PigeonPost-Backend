import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkFlightStatuses } from '@/lib/flightCron';
import { sendDailyReminders } from '@/lib/dailyReminders';

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
  // Serverless környezetben ez a végpont indítja a napi emlékeztetőket is (a futás gyors, ciklusonként egyszer küld)
  const reminders = await sendDailyReminders().catch((err) => {
    console.error('[cron] dailyReminders hiba:', err);
    return null;
  });
  if ('error' in result) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json({ ...result, reminders }, { status: 200 });
}
