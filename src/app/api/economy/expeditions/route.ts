import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import Expedition from '@/models/Expedition';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export const EXPEDITION_DESTINATIONS = [
  {
    id: 'valley_scout',
    name: 'Közeli Vadvölgy',
    description: 'Rövid felderítő repülés az erdőszélen és a patakparton.',
    durationMinutes: 30,
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
      const estimatedReturnAt = new Date(now.getTime() + dest.durationMinutes * 60000);

      // Calculate randomized rewards
      const levelMultiplier = 1 + ((pigeon.level || 1) - 1) * 0.15;
      const gold = Math.round((dest.minGold + Math.random() * (dest.maxGold - dest.minGold)) * levelMultiplier);
      const seeds = Math.round(dest.minSeeds + Math.random() * (dest.maxSeeds - dest.minSeeds));

      const expedition = await Expedition.create({
        userId: auth.userId,
        pigeonId: pigeon._id,
        destinationName: dest.name,
        durationMinutes: dest.durationMinutes,
        dispatchedAt: now,
        estimatedReturnAt,
        rewardGold: gold,
        rewardSeeds: seeds,
        status: 'exploring',
      });

      pigeon.status = 'flying';
      pigeon.fatigue = Math.min(100, (pigeon.fatigue || 0) + Math.round(dest.durationMinutes / 6));
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

      // Credit rewards to user
      const user = await User.findById(auth.userId);
      if (user) {
        user.gold = (user.gold ?? 0) + expedition.rewardGold;
        if (!user.inventory) user.inventory = { seeds: 10, cages: 1 };
        user.inventory.seeds = (user.inventory.seeds ?? 0) + expedition.rewardSeeds;
        user.totalKmExplored = (user.totalKmExplored ?? 0) + Math.round(expedition.durationMinutes * 1.5);
        await user.save();
      }

      // Restore pigeon to idle
      if (expedition.pigeonId) {
        await Pigeon.findByIdAndUpdate(expedition.pigeonId, { status: 'idle' });
      }

      expedition.status = 'claimed';
      await expedition.save();

      return NextResponse.json(
        {
          success: true,
          goldEarned: expedition.rewardGold,
          seedsEarned: expedition.rewardSeeds,
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
