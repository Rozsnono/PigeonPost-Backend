import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Message from '@/models/Message';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const user = await User.findById(auth.userId).select('loftBeaconUntil inventory.seeds');
    if (!user) {
      return NextResponse.json({ error: 'Felhasználó nem található!' }, { status: 404, headers: CORS_HEADERS });
    }

    const now = Date.now();
    const expiresTime = user.loftBeaconUntil ? new Date(user.loftBeaconUntil).getTime() : 0;
    const isBeaconActive = expiresTime > now;
    const secondsLeft = isBeaconActive ? Math.round((expiresTime - now) / 1000) : 0;

    return NextResponse.json(
      {
        isBeaconActive,
        beaconExpiresAt: isBeaconActive ? user.loftBeaconUntil : null,
        secondsLeft,
        inventorySeeds: user.inventory?.seeds || 0,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('GET /api/economy/loft/beacon error:', error);
    return NextResponse.json({ error: error?.message || 'Szerverhiba történt' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: 'Felhasználó nem található!' }, { status: 404, headers: CORS_HEADERS });
    }

    const BEACON_COST = 20; // 20 seeds for 3 hours
    const currentSeeds = user.inventory?.seeds || 0;
    if (currentSeeds < BEACON_COST) {
      return NextResponse.json(
        { error: `Nincs elég magod a Jelzőtűz meggyújtásához! Szükséges: ${BEACON_COST} mag, elérhető: ${currentSeeds}.` },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Deduct seeds
    user.inventory.seeds = Math.max(0, currentSeeds - BEACON_COST);

    // 3 hours duration
    const DURATION_MS = 3 * 60 * 60 * 1000;
    const now = Date.now();
    const existingExpires = user.loftBeaconUntil ? new Date(user.loftBeaconUntil).getTime() : 0;
    const baseTime = existingExpires > now ? existingExpires : now;
    user.loftBeaconUntil = new Date(baseTime + DURATION_MS);
    await user.save();

    // Speed up all currently flying incoming messages for this user (divide remaining flight time by 1.5)
    const incomingMessages = await Message.find({ recipientId: auth.userId, status: 'flying' });
    let spedUpCount = 0;
    for (const msg of incomingMessages) {
      const remainingMs = new Date(msg.estimatedArrivalAt).getTime() - now;
      if (remainingMs > 30000) {
        msg.estimatedArrivalAt = new Date(now + Math.max(30000, Math.floor(remainingMs / 1.5)));
        await msg.save();
        spedUpCount += 1;
      }
    }

    const secondsLeft = Math.round((new Date(user.loftBeaconUntil).getTime() - now) / 1000);

    return NextResponse.json(
      {
        success: true,
        isBeaconActive: true,
        beaconExpiresAt: user.loftBeaconUntil,
        secondsLeft,
        spedUpCount,
        remainingSeeds: user.inventory.seeds,
        message: '🔥 A Dúc Jelzőtüze 3 órán át magasan lobog a felhők felett! Minden feléd tartó madár +50% sebességgel navigál.',
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('POST /api/economy/loft/beacon error:', error);
    return NextResponse.json({ error: error?.message || 'Szerverhiba történt' }, { status: 500, headers: CORS_HEADERS });
  }
}
