import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';
import { z } from 'zod';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const adoptSchema = z.object({
  name: z.string().min(2).max(30),
  species: z.string().optional().default('pigeon'),
});

const BIRD_BASE_SPEEDS: Record<string, number> = {
  pigeon: 80,
  turtle_dove: 88,
  starling: 92,
  raven: 96,
  barn_owl: 102,
  golden_eagle: 160,
  peregrine: 170,
  falcon_express: 240,
  phoenix_express: 300,
};

const ADOPTION_COST = 500;

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const body = await req.json();
    const validation = adoptSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid data', details: validation.error.issues }, { status: 400, headers: CORS_HEADERS });
    }

    const { name, species } = validation.data;
    const user = await User.findById(auth.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    if (user.inventory.seeds < ADOPTION_COST) {
      return NextResponse.json({ error: `Nincs elég magod. Szükséges: ${ADOPTION_COST}, rendelkezel: ${user.inventory.seeds}.` }, { status: 400, headers: CORS_HEADERS });
    }

    // Deduct seeds and create pigeon atomically
    user.inventory.seeds -= ADOPTION_COST;
    await user.save();

    const identifier = `#${Math.floor(Math.random() * 9000) + 1000}`;
    const speed = BIRD_BASE_SPEEDS[species] || 80;

    const pigeon = await Pigeon.create({
      ownerId: auth.userId,
      name,
      identifier,
      species,
      speedKmH: speed,
      level: 1,
      status: 'idle',
      fatigue: 0,
    });

    return NextResponse.json({
      message: `Welcome to the loft, ${name}!`,
      pigeon,
      newSeedBalance: user.inventory.seeds,
    }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    console.error('POST /api/pigeons/adopt error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
