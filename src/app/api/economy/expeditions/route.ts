import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import Expedition from '@/models/Expedition';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const BIRD_SIZE_RANK: Record<string, number> = {
  falcon_express: 5,
  phoenix_express: 5,
  frost_phoenix: 5,
  golden_eagle: 4,
  peregrine: 3,
  raven: 3,
  barn_owl: 3,
  snowy_owl: 3,
  pigeon: 2,
  turtle_dove: 2,
  starling: 1,
};

export const EXPEDITION_DESTINATIONS = [
  {
    id: 'valley_scout',
    name: 'Közeli Vadvölgy',
    description: 'Rövid felderítő repülés az erdőszélen és a patakparton.',
    durationMinutes: 30,
    distanceKm: 25,
    minGold: 25,
    maxGold: 45,
    minSeeds: 5,
    maxSeeds: 10,
    minLevel: 1,
    icon: 'valley',
  },
  {
    id: 'mountain_ridge',
    name: 'Bükki Hegygerinc',
    description: 'Közepes távú repülés a magas hegygerincek és fenyvesek felett.',
    durationMinutes: 60,
    distanceKm: 70,
    minGold: 60,
    maxGold: 95,
    minSeeds: 10,
    maxSeeds: 20,
    minLevel: 1,
    icon: 'mountain',
  },
  {
    id: 'ancient_ruins',
    name: 'Ősi Várromok',
    description: 'Hosszú expedíció a középkori várromok és kincses pincék környékére.',
    durationMinutes: 120,
    distanceKm: 160,
    minGold: 130,
    maxGold: 210,
    minSeeds: 20,
    maxSeeds: 35,
    minLevel: 2,
    icon: 'castle',
  },
  {
    id: 'coastal_cliffs',
    name: 'Viharos Tengerpart',
    description: 'Nagy kihívást jelentő, egész délutános repülés a tengerparti szirtekre.',
    durationMinutes: 240,
    distanceKm: 350,
    minGold: 280,
    maxGold: 440,
    minSeeds: 40,
    maxSeeds: 70,
    minLevel: 2,
    icon: 'coast',
  },
];

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();

    const now = new Date();
    const expeditions = await Expedition.find({ userId: auth.userId, status: { $in: ['exploring', 'completed'] } })
      .populate('pigeonId', 'name species level status')
      .sort({ createdAt: -1 })
      .lean();

    // Auto-update completed expeditions
    const formatted = expeditions.map((exp: any) => {
      const returnTime = new Date(exp.estimatedReturnAt).getTime();
      const isCompleted = now.getTime() >= returnTime || exp.status === 'completed';
      const minutesLeft = Math.max(0, Math.round((returnTime - now.getTime()) / 60000));
      const totalDuration = exp.durationMinutes * 60000;
      const elapsed = Math.max(0, now.getTime() - new Date(exp.dispatchedAt).getTime());
      const progress = isCompleted ? 100 : Math.min(99, Math.round((elapsed / totalDuration) * 100));

      if (isCompleted && exp.status === 'exploring') {
        Expedition.findByIdAndUpdate(exp._id, { status: 'completed' }).exec();
      }

      return {
        ...exp,
        isCompleted,
        minutesLeft,
        progress,
      };
    });

    return NextResponse.json(
      {
        expeditions: formatted,
        destinations: EXPEDITION_DESTINATIONS,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('GET /api/economy/expeditions error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const body = await req.json();
    const { action } = body;

    // ─── 1. START EXPEDITION ──────────────────────────────────────────────────
    if (action === 'start') {
      const { pigeonId, destinationId } = body;
      if (!pigeonId || !destinationId) {
        return NextResponse.json({ error: 'Madár és célállomás megadása kötelező!' }, { status: 400, headers: CORS_HEADERS });
      }

      const dest = EXPEDITION_DESTINATIONS.find((d) => d.id === destinationId);
      if (!dest) {
        return NextResponse.json({ error: 'Érvénytelen célállomás!' }, { status: 400, headers: CORS_HEADERS });
      }

      const pigeon = await Pigeon.findById(pigeonId);
      if (!pigeon || pigeon.ownerId.toString() !== auth.userId) {
        return NextResponse.json({ error: 'A kiválasztott madár nem található a dúcodban!' }, { status: 404, headers: CORS_HEADERS });
      }
      if (pigeon.status !== 'idle') {
        return NextResponse.json({ error: `A madár jelenleg ${pigeon.status} állapotban van, csak tétlen madár indítható útnak!` }, { status: 400, headers: CORS_HEADERS });
      }

      const now = new Date();

      // ─── BIRD QUALITY & SPEED SCALING ──────────────────────────────
      const birdSpeed = Math.max(60, pigeon.speedKmH || 80);
      const birdLevel = Math.max(1, pigeon.level || 1);
      const sizeRank = BIRD_SIZE_RANK[pigeon.species] || 2;

      // Speed scaling: Baseline is 80 km/h. Faster birds complete expedition MUCH quicker!
      // (e.g., 160 km/h cuts base duration in half; 300 km/h cuts to ~27% time)
      const speedFactor = Math.max(0.25, 80 / birdSpeed);
      // Each level further optimizes flight stamina by 5% (up to 20% bonus)
      const levelSpeedBonus = 1 - Math.min(0.20, (birdLevel - 1) * 0.05);
      const effectiveDurationMinutes = Math.max(2, Math.round(dest.durationMinutes * speedFactor * levelSpeedBonus));

      const estimatedReturnAt = new Date(now.getTime() + effectiveDurationMinutes * 60000);

      // Value & Reward scaling: Better birds find significantly more loot and seeds!
      // 1. Level bonus: +20% per level above 1
      const levelMultiplier = 1 + (birdLevel - 1) * 0.20;
      // 2. Speed bonus: Faster birds scour deeper regions (+1% per 1.3 km/h above 80)
      const speedRewardMultiplier = 1 + Math.max(0, (birdSpeed - 80) / 130);
      // 3. Species / size tier bonus (+12% per rank above 2)
      const rankMultiplier = 1 + Math.max(0, (sizeRank - 2) * 0.12);

      const totalRewardMultiplier = levelMultiplier * speedRewardMultiplier * rankMultiplier;

      const baseGold = dest.minGold + Math.random() * (dest.maxGold - dest.minGold);
      const gold = Math.round(baseGold * totalRewardMultiplier);

      const baseSeeds = dest.minSeeds + Math.random() * (dest.maxSeeds - dest.minSeeds);
      const seedBonus = 1 + (birdLevel - 1) * 0.15 + (birdSpeed >= 120 ? 0.35 : 0);
      const seeds = Math.round(baseSeeds * seedBonus);

      const expedition = await Expedition.create({
        userId: auth.userId,
        pigeonId: pigeon._id,
        destinationName: dest.name,
        durationMinutes: effectiveDurationMinutes,
        dispatchedAt: now,
        estimatedReturnAt,
        rewardGold: gold,
        rewardSeeds: seeds,
        status: 'exploring',
      });

      pigeon.status = 'flying';
      pigeon.fatigue = Math.min(100, (pigeon.fatigue || 0) + Math.max(5, Math.round(effectiveDurationMinutes / 5)));
      await pigeon.save();

      return NextResponse.json(
        {
          success: true,
          message: `${pigeon.name} sikeresen útnak indult felfedezni: ${dest.name}!`,
          expedition,
        },
        { status: 201, headers: CORS_HEADERS }
      );
    }

    // ─── 2. CLAIM EXPEDITION REWARDS ──────────────────────────────────────────
    if (action === 'claim') {
      const { expeditionId } = body;
      if (!expeditionId) {
        return NextResponse.json({ error: 'Hiányzó expeditionId!' }, { status: 400, headers: CORS_HEADERS });
      }

      const expedition = await Expedition.findById(expeditionId);
      if (!expedition || expedition.userId.toString() !== auth.userId) {
        return NextResponse.json({ error: 'Expedíció nem található!' }, { status: 404, headers: CORS_HEADERS });
      }
      if (expedition.status === 'claimed') {
        return NextResponse.json({ error: 'A zsákmányt már átvetted!' }, { status: 400, headers: CORS_HEADERS });
      }

      const now = new Date();
      if (now.getTime() < new Date(expedition.estimatedReturnAt).getTime() && expedition.status !== 'completed') {
        return NextResponse.json({ error: 'A madár még nem tért vissza a felfedező útról!' }, { status: 400, headers: CORS_HEADERS });
      }

      // Credit rewards & XP to user
      const user = await User.findById(auth.userId);
      const userXpEarned = Math.max(25, Math.round((expedition.durationMinutes || 30) * 1.2 + (expedition.rewardGold || 30) * 0.35));
      let userLeveledUp = false;

      if (user) {
        user.gold = (user.gold ?? 0) + expedition.rewardGold;
        if (!user.inventory) user.inventory = { seeds: 10, cages: 1 };
        user.inventory.seeds = (user.inventory.seeds ?? 0) + expedition.rewardSeeds;
        user.totalKmExplored = (user.totalKmExplored ?? 0) + Math.round((expedition.durationMinutes || 30) * 1.5);

        let uLvl = user.level || 1;
        let uXp = (user.xp || 0) + userXpEarned;
        while (uXp >= uLvl * 100) {
          uXp -= uLvl * 100;
          uLvl += 1;
          user.gold += uLvl * 25; // Level up bonus
          userLeveledUp = true;
        }
        user.level = uLvl;
        user.xp = uXp;
        await user.save();
      }

      // Restore pigeon to idle & award Pigeon XP
      let pigeonLeveledUp = false;
      const pigeonXpEarned = Math.max(30, Math.round((expedition.durationMinutes || 30) * 1.5 + (expedition.rewardGold || 30) * 0.4));
      let pigeonName = 'A madár';
      let pigeonLevel = 1;
      let pigeonXp = 0;

      if (expedition.pigeonId) {
        const pigeon = await Pigeon.findById(expedition.pigeonId);
        if (pigeon) {
          pigeon.status = 'idle';
          pigeonName = pigeon.name;
          let pLvl = pigeon.level || 1;
          let pXp = (pigeon.xp || 0) + pigeonXpEarned;
          while (pXp >= pLvl * 100) {
            pXp -= pLvl * 100;
            pLvl += 1;
            pigeon.speedKmH = (pigeon.speedKmH || 80) + 2; // +2 km/h permanent speed per level
            pigeonLeveledUp = true;
          }
          pigeon.level = pLvl;
          pigeon.xp = pXp;
          pigeonLevel = pLvl;
          pigeonXp = pXp;
          await pigeon.save();
        }
      }

      expedition.status = 'claimed';
      await expedition.save();

      return NextResponse.json(
        {
          success: true,
          goldEarned: expedition.rewardGold,
          seedsEarned: expedition.rewardSeeds,
          userXpEarned,
          pigeonXpEarned,
          userLeveledUp,
          newUserLevel: user?.level || 1,
          newUserXp: user?.xp || 0,
          pigeonLeveledUp,
          newPigeonLevel: pigeonLevel,
          newPigeonXp: pigeonXp,
          pigeonName,
          reward: {
            gold: expedition.rewardGold,
            seeds: expedition.rewardSeeds,
            xp: userXpEarned,
            pigeonXp: pigeonXpEarned,
          },
          newGold: user?.gold,
          newSeeds: user?.inventory?.seeds,
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({ error: 'Érvénytelen action (start vagy claim szükséges)!' }, { status: 400, headers: CORS_HEADERS });
  } catch (error) {
    console.error('POST /api/economy/expeditions error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
