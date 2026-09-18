import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Pigeon from '@/models/Pigeon';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// PATCH /api/pigeons/[id] — update pigeon name or feed seeds
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  const { id } = await params;

  try {
    await connectToDatabase();
    const pigeon = await Pigeon.findById(id);
    if (!pigeon) return NextResponse.json({ error: 'Pigeon not found' }, { status: 404, headers: CORS_HEADERS });
    if (pigeon.ownerId.toString() !== auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: CORS_HEADERS });
    }

    const body = await req.json();

    // Rename
    if (body.name && typeof body.name === 'string' && body.name.trim().length > 0) {
      pigeon.name = body.name.trim().substring(0, 30);
    }

    // Feed seeds: costs 2 seeds, restores 40 energy (reduces fatigue) and awards +15 XP
    let pigeonLeveledUp = false;
    let userLeveledUp = false;
    if (body.action === 'feed') {
      const user = await User.findById(auth.userId);
      if (!user || user.inventory.seeds < 2) {
        return NextResponse.json({ error: 'Not enough seeds (2 required)' }, { status: 400, headers: CORS_HEADERS });
      }
      user.inventory.seeds -= 2;

      // Award User +10 XP for caretaking
      let uLvl = user.level || 1;
      let uXp = (user.xp || 0) + 10;
      while (uXp >= uLvl * 100) {
        uXp -= uLvl * 100;
        uLvl += 1;
        user.gold += uLvl * 25;
        userLeveledUp = true;
      }
      user.level = uLvl;
      user.xp = uXp;
      await user.save();

      pigeon.fatigue = Math.max(0, pigeon.fatigue - 40);

      // Award Pigeon +15 XP
      let pLvl = pigeon.level || 1;
      let pXp = (pigeon.xp || 0) + 15;
      while (pXp >= pLvl * 100) {
        pXp -= pLvl * 100;
        pLvl += 1;
        pigeon.speedKmH = (pigeon.speedKmH || 80) + 2;
        pigeonLeveledUp = true;
      }
      pigeon.level = pLvl;
      pigeon.xp = pXp;
    }

    await pigeon.save();

    return NextResponse.json({ pigeon, pigeonLeveledUp, userLeveledUp }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('PATCH /api/pigeons/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
