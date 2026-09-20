import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Pigeon from '@/models/Pigeon';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';
import { simulateLoftTimeDelta } from '@/lib/loftSimulation';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/pigeons — get my pigeons
export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    await simulateLoftTimeDelta(auth.userId);
    let pigeons = await Pigeon.find({ ownerId: auth.userId }).lean();
    if (pigeons.length === 0) {
      const defaultPigeon = await Pigeon.create({
        ownerId: auth.userId,
        name: 'Barnaby',
        identifier: `#${Math.floor(Math.random() * 9000) + 1000}`,
        level: 1,
        status: 'idle',
        species: 'pigeon',
        speedKmH: 80,
        fatigue: 0,
      });
      pigeons = [defaultPigeon.toObject() as any];
    }
    return NextResponse.json({ pigeons }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('GET /api/pigeons error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
