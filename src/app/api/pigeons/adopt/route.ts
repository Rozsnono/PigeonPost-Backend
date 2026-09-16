import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';
import { z } from 'zod';
import { AVIARY_SPECIES } from '@/app/api/aviary/route';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const adoptSchema = z.object({
  name: z.string().min(1).max(30),
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

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const body = await req.json();
    const validation = adoptSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Érvénytelen madárnév (1-30 karakter szükséges).' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { name, species } = validation.data;
    const user = await User.findById(auth.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    const targetSpec = AVIARY_SPECIES.find((s) => s.id === species);
    const requiredGold = targetSpec?.priceGold || 0;

    // Check gold if bird species has gold price
    if (requiredGold > 0) {
      const userGold = user.gold ?? 0;
      if (userGold < requiredGold) {
        return NextResponse.json(
          {
            error: `Nincs elég aranyad ehhez a madárhoz! Szükséges: ${requiredGold} arany, jelenleg: ${userGold} arany.`,
          },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      user.gold = userGold - requiredGold;
    }

    // Add species to user's owned birds
    if (!user.ownedBirds) user.ownedBirds = ['pigeon'];
    if (!user.ownedBirds.includes(species)) {
      user.ownedBirds.push(species);
    }
    user.activeBird = species;
    await user.save();

    const identifier = `#${Math.floor(Math.random() * 9000) + 1000}`;
    const speed = targetSpec?.speedKmH || BIRD_BASE_SPEEDS[species] || 80;

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

    return NextResponse.json(
      {
        message: `Üdvözlünk a dúcban, ${name}!`,
        pigeon,
        newSeedBalance: user.inventory?.seeds ?? 50,
        newGoldBalance: user.gold,
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('POST /api/pigeons/adopt error:', error);
    return NextResponse.json({ error: 'Belső szerver hiba történt.' }, { status: 500, headers: CORS_HEADERS });
  }
}
