import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import BirdSpecies, { IBirdSpecies } from '@/models/BirdSpecies';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export const AVIARY_SPECIES = [
  {
    id: 'pigeon',
    name: 'Postagalamb',
    speedKmH: 80,
    priceGold: 0,
    subtitle: 'Hűséges postagalamb',
    requirementText: 'Alapértelmezett',
    minLevel: 1,
    sizeRank: 1,
  },
  {
    id: 'turtle_dove',
    name: 'Balkáni gerle',
    speedKmH: 88,
    priceGold: 750,
    subtitle: 'Békés balkáni gerle',
    requirementText: '750 arany',
    minLevel: 1,
    sizeRank: 2,
  },
  {
    id: 'starling',
    name: 'Seregély',
    speedKmH: 92,
    priceGold: 1100,
    subtitle: 'Fürge seregély',
    requirementText: 'Seregély Kör elérése',
    minLevel: 2,
    sizeRank: 2,
  },
  {
    id: 'raven',
    name: 'Holló',
    speedKmH: 96,
    priceGold: 950,
    subtitle: 'Bölcs északi holló',
    requirementText: '950 arany',
    minLevel: 2,
    sizeRank: 3,
  },
  {
    id: 'barn_owl',
    name: 'Gyöngybagoly',
    speedKmH: 102,
    priceGold: 1400,
    subtitle: 'Éjjeli nesztelen gyöngybagoly',
    requirementText: '1,400 arany',
    minLevel: 3,
    sizeRank: 4,
  },
  {
    id: 'golden_eagle',
    name: 'Szirti sas',
    speedKmH: 160,
    priceGold: 7800,
    subtitle: 'Királyi szirti sas',
    requirementText: 'Sasfészek tagság',
    minLevel: 4,
    sizeRank: 7,
  },
  {
    id: 'peregrine',
    name: 'Vándorsólyom',
    speedKmH: 170,
    priceGold: 12000,
    subtitle: 'A világ leggyorsabb vándorsólyma',
    requirementText: '12,000 arany',
    minLevel: 5,
    sizeRank: 6,
  },
  {
    id: 'falcon_express',
    name: 'Sólyom Expressz',
    speedKmH: 240,
    priceGold: 25000,
    subtitle: 'Birodalmi expressz futár',
    requirementText: 'Birodalmi rang',
    minLevel: 5,
    sizeRank: 8,
  },
  {
    id: 'phoenix_express',
    name: 'Főnix Expressz',
    speedKmH: 300,
    priceGold: 50000,
    subtitle: 'Misztikus főnix villámrepülés',
    requirementText: 'Legenda elérése',
    minLevel: 6,
    sizeRank: 10,
  },
];

export async function ensureDefaultSpecies() {
  const count = await BirdSpecies.countDocuments();
  if (count === 0) {
    console.log('[BirdSpecies] Seeding default 9 species into MongoDB...');
    for (const spec of AVIARY_SPECIES) {
      await BirdSpecies.create({
        speciesId: spec.id,
        name: spec.name,
        speedKmH: spec.speedKmH,
        priceGold: spec.priceGold,
        subtitle: spec.subtitle,
        requirementText: spec.requirementText,
        minLevel: spec.minLevel,
        sizeRank: spec.sizeRank,
        isActive: true,
      });
    }
  }
}

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    await ensureDefaultSpecies();

    const user = await User.findById(auth.userId).lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    const ownedBirds: string[] = user.ownedBirds || ['pigeon'];
    const activeBirdId = user.activeBird || 'pigeon';

    // Fetch dynamic active species from MongoDB
    const dbSpecies = await BirdSpecies.find({ isActive: true }).sort({ minLevel: 1, priceGold: 1 }).lean();

    const birds = dbSpecies.map((spec: any) => {
      const isOwned = ownedBirds.includes(spec.speciesId);
      const isCurrentCarrier = activeBirdId === spec.speciesId;

      return {
        id: spec.speciesId,
        speciesId: spec.speciesId,
        name: spec.name,
        speedKmH: spec.speedKmH,
        priceGold: spec.priceGold,
        subtitle: spec.subtitle || '',
        requirementText: spec.requirementText || '',
        minLevel: spec.minLevel || 1,
        avatarBase64: spec.avatarBase64 || '',
        flyingBase64: spec.flyingBase64 || '',
        sizeRank: spec.sizeRank || 1,
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
        totalCount: birds.length,
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
    await ensureDefaultSpecies();

    const user = await User.findById(auth.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    const body = await req.json();
    const { action, birdId } = body;

    // Helper to find species by ID in MongoDB or fallback
    const findSpecies = async (id: string) => {
      const dbSpec = await BirdSpecies.findOne({ speciesId: id, isActive: true }).lean();
      if (dbSpec) return dbSpec;
      const fallback = AVIARY_SPECIES.find((s) => s.id === id);
      if (fallback) {
        return {
          speciesId: fallback.id,
          name: fallback.name,
          speedKmH: fallback.speedKmH,
          priceGold: fallback.priceGold,
          minLevel: fallback.minLevel,
        };
      }
      return null;
    };

    // 1. SELECT CURRENT CARRIER
    if (action === 'select') {
      const ownedBirds: string[] = user.ownedBirds || ['pigeon'];
      if (!ownedBirds.includes(birdId)) {
        return NextResponse.json({ error: 'You do not own this bird' }, { status: 400, headers: CORS_HEADERS });
      }

      user.activeBird = birdId;
      await user.save();

      const targetSpec = await findSpecies(birdId);
      if (targetSpec) {
        await Pigeon.findOneAndUpdate(
          { ownerId: user._id },
          { species: targetSpec.speciesId, speedKmH: targetSpec.speedKmH, name: targetSpec.name }
        );
      }

      return NextResponse.json({ success: true, activeBird: birdId }, { status: 200, headers: CORS_HEADERS });
    }

    // 2. BUY BIRD WITH GOLD
    if (action === 'buy') {
      const targetSpec = await findSpecies(birdId);
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
        { species: targetSpec.speciesId, speedKmH: targetSpec.speedKmH, name: targetSpec.name },
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
