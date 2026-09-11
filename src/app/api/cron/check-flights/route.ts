import { NextRequest, NextResponse } from 'next/server';
import { checkFlightStatuses } from '@/lib/flightCron';

// GET /api/cron/check-flights — checks for arriving letters and returning pigeons, updates DB & triggers push
export async function GET(req: NextRequest) {
  const result = await checkFlightStatuses();
  if ('error' in result) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result, { status: 200 });
}
