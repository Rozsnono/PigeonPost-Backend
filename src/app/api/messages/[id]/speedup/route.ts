import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const messageId = params.id;
    const body = await req.json().catch(() => ({}));
    const { type, pigeonId } = body;

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'A keresett levél nem található!' }, { status: 404, headers: CORS_HEADERS });
    }

    if (message.recipientId.toString() !== auth.userId) {
      return NextResponse.json({ error: 'Csak a címzett gyorsíthatja fel az érkező galambot!' }, { status: 403, headers: CORS_HEADERS });
    }

    if (message.status !== 'flying') {
      return NextResponse.json({ error: 'Ez a levél már megérkezett vagy nem repül!' }, { status: 400, headers: CORS_HEADERS });
    }

    const now = Date.now();
    const arrivalTime = new Date(message.estimatedArrivalAt).getTime();
    const remainingMs = arrivalTime - now;

    if (remainingMs <= 10000) {
      return NextResponse.json({ error: 'A galamb már éppen megérkezett a dúcodba!' }, { status: 400, headers: CORS_HEADERS });
    }

    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: 'Felhasználó nem található!' }, { status: 404, headers: CORS_HEADERS });
    }

    // TYPE 1: TAILWIND (5. opció - Hátszél bűbáj 10 magért)
    if (type === 'tailwind') {
      const TAILWIND_COST = 10;
      const currentSeeds = user.inventory?.seeds || 0;
      if (currentSeeds < TAILWIND_COST) {
        return NextResponse.json(
          { error: `Nincs elég magod a hátszél idézéséhez! Szükséges: ${TAILWIND_COST} mag, elérhető: ${currentSeeds}.` },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      user.inventory.seeds = Math.max(0, currentSeeds - TAILWIND_COST);
      await user.save();

      // Cut remaining time by half (min 30 seconds)
      const newRemainingMs = Math.max(30000, Math.floor(remainingMs / 2));
      message.estimatedArrivalAt = new Date(now + newRemainingMs);
      message.hasTailwind = true;
      await message.save();

      const minutesLeft = Math.max(1, Math.round(newRemainingMs / 60000));

      return NextResponse.json(
        {
          success: true,
          type: 'tailwind',
          minutesLeft,
          newEstimatedArrivalAt: message.estimatedArrivalAt,
          remainingSeeds: user.inventory.seeds,
          message: `💨 A kedvező hátszél felére csökkentette a galamb repülési idejét! Várható érkezés: ~${minutesLeft} perc.`,
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // TYPE 2: ESCORT (2. opció - Kísérőmadár küldése elébe a dúcból)
    if (type === 'escort') {
      if (!pigeonId) {
        return NextResponse.json({ error: 'Kérlek válassz egy madarat a dúcodból!' }, { status: 400, headers: CORS_HEADERS });
      }

      if (message.escortPigeonId) {
        return NextResponse.json({ error: 'Ehhez a járathoz már küldtél kísérőmadarat!' }, { status: 400, headers: CORS_HEADERS });
      }

      const escortPigeon = await Pigeon.findOne({ _id: pigeonId, ownerId: auth.userId, status: 'idle' });
      if (!escortPigeon) {
        return NextResponse.json({ error: 'A kiválasztott madár jelenleg nem a dúcban pihen vagy nem elérhető!' }, { status: 400, headers: CORS_HEADERS });
      }

      if ((escortPigeon.fatigue || 0) >= 90) {
        return NextResponse.json({ error: `${escortPigeon.name} túl fáradt egy újabb kísérő repüléshez! Pihentesd vagy etesd meg.` }, { status: 400, headers: CORS_HEADERS });
      }

      // Calculate reduction based on escort bird speed (80 km/h = 40% reduction, up to 70% reduction)
      const speed = escortPigeon.speedKmH || 80;
      const speedBonus = Math.min(0.30, ((speed - 80) / 100) * 0.15);
      const reductionRatio = 0.40 + speedBonus; // 40% - 70%
      const newRemainingMs = Math.max(30000, Math.floor(remainingMs * (1 - reductionRatio)));

      message.estimatedArrivalAt = new Date(now + newRemainingMs);
      message.escortPigeonId = escortPigeon._id;
      message.escortPigeonName = escortPigeon.name;
      await message.save();

      // Escort bird gains XP and a bit of fatigue
      escortPigeon.xp = (escortPigeon.xp || 0) + 30;
      const requiredXp = (escortPigeon.level || 1) * 100;
      let leveledUp = false;
      if (escortPigeon.xp >= requiredXp) {
        escortPigeon.level = (escortPigeon.level || 1) + 1;
        escortPigeon.speedKmH = (escortPigeon.speedKmH || 80) + 2;
        leveledUp = true;
      }
      escortPigeon.fatigue = Math.min(100, (escortPigeon.fatigue || 0) + 15);
      escortPigeon.satiety = Math.max(0, (escortPigeon.satiety || 100) - 10);
      await escortPigeon.save();

      const minutesLeft = Math.max(1, Math.round(newRemainingMs / 60000));

      return NextResponse.json(
        {
          success: true,
          type: 'escort',
          escortName: escortPigeon.name,
          minutesLeft,
          newEstimatedArrivalAt: message.estimatedArrivalAt,
          leveledUp,
          message: `🦅 ${escortPigeon.name} (${speed} km/h) elérepült a futárnak és felvezeti a dúcba! Várható érkezés: ~${minutesLeft} perc (+30 XP a kísérőnek).`,
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({ error: 'Érvénytelen gyorsítási típus! Használj "tailwind" vagy "escort" opciót.' }, { status: 400, headers: CORS_HEADERS });
  } catch (error: any) {
    console.error('POST /api/messages/[id]/speedup error:', error);
    return NextResponse.json({ error: error?.message || 'Szerverhiba történt' }, { status: 500, headers: CORS_HEADERS });
  }
}
