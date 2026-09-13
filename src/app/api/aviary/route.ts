import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export const AVIARY_SPECIES = [
  {
    id: 'pigeon',
    name: 'Pigeon',
    speedKmH: 80,
    priceGold: 0,
    subtitle: 'Hűséges postagalamb',
    requirementText: 'Alapértelmezett',
    minLevel: 1,
  },
  {
    id: 'turtle_dove',
    name: 'Turtle Dove',
    speedKmH: 88,
    priceGold: 750,
    subtitle: 'Békés balkáni gerle',
    requirementText: '750 arany',
    minLevel: 1,
  },
  {
    id: 'starling',
    name: 'Starling',
    speedKmH: 92,
    priceGold: 1100,
    subtitle: 'Fürge seregély',
    requirementText: 'Reach Starling Circle',
    minLevel: 2,
  },
  {
    id: 'raven',
    name: 'Raven',
    speedKmH: 96,
    priceGold: 950,
    subtitle: 'Bölcs északi holló',
    requirementText: '950 arany',
    minLevel: 2,
  },
  {
    id: 'barn_owl',
    name: 'Barn Owl',
    speedKmH: 102,
    priceGold: 1400,
    subtitle: 'Éjjeli nesztelen gyöngybagoly',
    requirementText: '1,400 arany',
    minLevel: 3,
  },
  {
    id: 'golden_eagle',
    name: 'Golden Eagle',
    speedKmH: 160,
    priceGold: 7800,
    subtitle: 'Királyi szirti sas',
    requirementText: 'Reach Golden Current',
    minLevel: 4,
  },
  {
    id: 'peregrine',
    name: 'Peregrine',
    speedKmH: 170,
    priceGold: 12000,
    subtitle: 'A világ leggyorsabb vándorsólyma',
    requirementText: '12,000 arany',
    minLevel: 5,
  },
  {
    id: 'falcon_express',
    name: 'Falcon Express',
    speedKmH: 240,
    priceGold: 25000,
    subtitle: 'Birodalmi expressz futár',
    requirementText: 'Journey pack',
    minLevel: 5,
  },
  {
    id: 'phoenix_express',
    name: 'Phoenix Express',
    speedKmH: 300,
    priceGold: 50000,
    subtitle: 'Misztikus főnix villámrepülés',
    requirementText: 'Journey pack',
    minLevel: 6,
  },
];

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const user = await User.findById(auth.userId).lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    const ownedBirds: string[] = user.ownedBirds || ['pigeon'];
    const activeBirdId = user.activeBird || 'pigeon';

    const birds = AVIARY_SPECIES.map((spec) => {
      const isOwned = ownedBirds.includes(spec.id);
      const isCurrentCarrier = activeBirdId === spec.id;

      return {
        ...spec,
        isOwned,
        isCurrentCarrier,
        status: isCurrentCarrier ? 'Current carrier' : isOwned ? 'Owned' : 'Locked',
      };
    });

    return NextResponse.json(
      {
        gold: user.gold ?? 5,
        activeBird: activeBirdId,
        ownedCount: ownedBirds.length,
        totalCount: AVIARY_SPECIES.length,
        birds,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('GET /api/aviary error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const user = await User.findById(auth.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    const body = await req.json();
    const { action, birdId } = body;

    // 1. SELECT CURRENT CARRIER
    if (action === 'select') {
      const ownedBirds: string[] = user.ownedBirds || ['pigeon'];
      if (!ownedBirds.includes(birdId)) {
        return NextResponse.json({ error: 'You do not own this bird' }, { status: 400, headers: CORS_HEADERS });
      }

      user.activeBird = birdId;
      await user.save();

      // Also update primary pigeon species and speed if exists
      const targetSpec = AVIARY_SPECIES.find((s) => s.id === birdId);
      if (targetSpec) {
        await Pigeon.findOneAndUpdate(
          { ownerId: user._id },
          { species: targetSpec.id, speedKmH: targetSpec.speedKmH, name: targetSpec.name }
        );
      }

      return NextResponse.json({ success: true, activeBird: birdId }, { status: 200, headers: CORS_HEADERS });
    }

    // 2. BUY BIRD WITH GOLD
    if (action === 'buy') {
      const targetSpec = AVIARY_SPECIES.find((s) => s.id === birdId);
      if (!targetSpec) {
        return NextResponse.json({ error: 'Unknown bird species' }, { status: 404, headers: CORS_HEADERS });
      }

      const ownedBirds: string[] = user.ownedBirds || ['pigeon'];
      if (ownedBirds.includes(birdId)) {
        return NextResponse.json({ error: 'You already own this bird' }, { status: 400, headers: CORS_HEADERS });
      }

      const currentGold = user.gold ?? 5;
      if (currentGold < targetSpec.priceGold) {
        return NextResponse.json({ error: 'Not enough gold' }, { status: 400, headers: CORS_HEADERS });
      }

      user.gold = currentGold - targetSpec.priceGold;
      user.ownedBirds.push(birdId);
      user.activeBird = birdId;
      await user.save();

      // Create or update bird in user's loft
      await Pigeon.findOneAndUpdate(
        { ownerId: user._id },
        { species: targetSpec.id, speedKmH: targetSpec.speedKmH, name: targetSpec.name },
        { upsert: true }
      );

      return NextResponse.json(
        {
          success: true,
          gold: user.gold,
          ownedBirds: user.ownedBirds,
          activeBird: user.activeBird,
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // 3. CLAIM BONUS GOLD (e.g. +20 gold)
    if (action === 'claim_bonus') {
      const amount = Number(body.amount) || 20;
      user.gold = (user.gold ?? 5) + amount;
      await user.save();
      return NextResponse.json({ success: true, gold: user.gold }, { status: 200, headers: CORS_HEADERS });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: CORS_HEADERS });
  } catch (error) {
    console.error('POST /api/aviary error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
