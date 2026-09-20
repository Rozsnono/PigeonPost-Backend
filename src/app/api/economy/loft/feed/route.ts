import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import { verifyAuth } from '@/lib/auth';

import { simulateLoftTimeDelta } from '@/lib/loftSimulation';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  try {
    const auth = verifyAuth(req);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Bejelentkezés szükséges!' }, { status: 401, headers: CORS_HEADERS });
    }

    await connectToDatabase();
    await simulateLoftTimeDelta(auth.userId);

    const user = await User.findById(auth.userId).select('inventory feederSeeds');
    if (!user) {
      return NextResponse.json({ error: 'Felhasználó nem található!' }, { status: 404, headers: CORS_HEADERS });
    }

    const idlePigeons = await Pigeon.find({ ownerId: auth.userId, status: 'idle' })
      .select('name species level fatigue satiety speedKmH')
      .lean();

    const strayPigeons = await Pigeon.find({ ownerId: auth.userId, status: 'stray' })
      .select('name species level fatigue satiety speedKmH straySince')
      .lean();

    return NextResponse.json(
      {
        feederSeeds: user.feederSeeds || 0,
        inventorySeeds: user.inventory?.seeds || 0,
        idlePigeons,
        strayPigeons,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('[loft/feed GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Szerverhiba történt' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = verifyAuth(req);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Bejelentkezés szükséges!' }, { status: 401, headers: CORS_HEADERS });
    }

    await connectToDatabase();
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: 'Felhasználó nem található!' }, { status: 404, headers: CORS_HEADERS });
    }

    const body = await req.json().catch(() => ({}));
    const { action = 'fill_and_feed', amount = 10, pigeonId } = body;

    // Action 0: Retrieve stray bird using 25 seeds
    if (action === 'retrieve_stray') {
      if (!pigeonId) {
        return NextResponse.json({ error: 'Madár azonosító szükséges!' }, { status: 400, headers: CORS_HEADERS });
      }

      const strayPigeon = await Pigeon.findOne({ _id: pigeonId, ownerId: auth.userId, status: 'stray' });
      if (!strayPigeon) {
        return NextResponse.json({ error: 'A keresett elszökött madár nem található!' }, { status: 404, headers: CORS_HEADERS });
      }

      const RETRIEVE_COST = 25;
      const currentSeeds = user.inventory?.seeds || 0;
      if (currentSeeds < RETRIEVE_COST) {
        return NextResponse.json(
          { error: `Nincs elég magod a madár visszacsalogatásához! Szükséges: ${RETRIEVE_COST} mag, elérhető: ${currentSeeds}.` },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      user.inventory.seeds = Math.max(0, currentSeeds - RETRIEVE_COST);
      await user.save();

      strayPigeon.status = 'idle';
      strayPigeon.satiety = 60;
      strayPigeon.fatigue = 20;
      strayPigeon.straySince = null as any;
      strayPigeon.starvingSince = null as any;
      strayPigeon.lastLoftTickAt = new Date();
      await strayPigeon.save();

      return NextResponse.json(
        {
          success: true,
          message: `${strayPigeon.name} megérezte a friss magok illatát és boldogan visszatért a dúcba!`,
          pigeon: strayPigeon,
          inventorySeeds: user.inventory.seeds,
        },
        { headers: CORS_HEADERS }
      );
    }

    const currentInventorySeeds = user.inventory?.seeds || 0;
    let currentFeederSeeds = user.feederSeeds || 0;

    // Action 1: Fill seeds from inventory into the loft feeder trough
    if (action === 'fill_feeder' || action === 'fill_and_feed') {
      const requestedAmount = Math.max(1, Math.floor(Number(amount) || 10));
      if (currentInventorySeeds < requestedAmount) {
        return NextResponse.json(
          {
            error: `Nincs elég mag a zsákodban! Szükséges: ${requestedAmount}, elérhető: ${currentInventorySeeds}.`,
          },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      user.inventory.seeds = Math.max(0, currentInventorySeeds - requestedAmount);
      currentFeederSeeds += requestedAmount;
      user.feederSeeds = currentFeederSeeds;
    }

    // Now feed idle pigeons in the loft from the feeder
    const idlePigeons = await Pigeon.find({ ownerId: auth.userId, status: 'idle' });
    let seedsConsumed = 0;
    let fedCount = 0;
    const leveledUpPigeons: string[] = [];
    let userXpGained = 0;

    for (const pigeon of idlePigeons) {
      const pigeonFatigue = pigeon.fatigue ?? 0;
      const pigeonSatiety = pigeon.satiety ?? 100;

      // Needs food if tired (fatigue > 0) or hungry (satiety < 100)
      if (pigeonFatigue > 0 || pigeonSatiety < 100) {
        let pigeonAte = false;

        while (currentFeederSeeds > 0 && ((pigeon.fatigue ?? 0) > 0 || (pigeon.satiety ?? 100) < 100)) {
          currentFeederSeeds -= 1;
          seedsConsumed += 1;
          pigeonAte = true;

          // Each 1 seed restores +10 satiety, reduces -10 fatigue, +5 bird XP, +2 user XP
          pigeon.satiety = Math.min(100, (pigeon.satiety ?? 100) + 10);
          pigeon.fatigue = Math.max(0, (pigeon.fatigue ?? 0) - 10);
          pigeon.xp = (pigeon.xp || 0) + 5;
          userXpGained += 2;

          // Check bird level up
          const xpNeeded = (pigeon.level || 1) * 100;
          if (pigeon.xp >= xpNeeded) {
            pigeon.level = (pigeon.level || 1) + 1;
            pigeon.speedKmH = (pigeon.speedKmH || 80) + 2;
            leveledUpPigeons.push(pigeon.name);
          }
        }

        if (pigeonAte) {
          fedCount += 1;
          await pigeon.save();
        }
      }
    }

    user.feederSeeds = currentFeederSeeds;
    if (userXpGained > 0) {
      user.xp = (user.xp || 0) + userXpGained;
      // Check user level up
      const userXpForNext = (user.level || 1) * 100;
      if (user.xp >= userXpForNext) {
        user.level = (user.level || 1) + 1;
      }
    }

    await user.save();

    let message = '';
    if (seedsConsumed > 0) {
      message = `${fedCount} madár lakott jól a dúc vályújából! Elfogyasztott mag: ${seedsConsumed} db. A vályúban maradt: ${currentFeederSeeds} mag.`;
      if (leveledUpPigeons.length > 0) {
        message += `\n\n🌟 Szintet lépett: ${leveledUpPigeons.join(', ')}!`;
      }
    } else if (action === 'fill_feeder') {
      message = `Sikeresen kihelyeztél ${amount} magot a dúc etetővályújába! Minden madár tele van, a magok a vályúban várják az éhes madarakat.`;
    } else {
      message = `A vályú jelenleg ${currentFeederSeeds} magot tartalmaz. A dúcban lévő madaraid nem éhesek és kipihentek!`;
    }

    return NextResponse.json(
      {
        success: true,
        message,
        feederSeeds: user.feederSeeds,
        inventorySeeds: user.inventory.seeds,
        seedsConsumed,
        fedCount,
        leveledUpPigeons,
        userXpGained,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('[loft/feed POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Szerverhiba történt' }, { status: 500, headers: CORS_HEADERS });
  }
}
