import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';
import { z } from 'zod';
import { createLog } from '@/lib/logger';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const BIRD_SIZE_RANK: Record<string, number> = {
  phoenix_express: 10,
  phoenix: 10,
  golden_eagle: 9,
  eagle: 9,
  barn_owl: 8,
  raven: 7,
  falcon_express: 6,
  peregrine: 5,
  falcon: 5,
  turtle_dove: 4,
  starling: 3,
  pigeon: 2,
  rock_dove: 2,
  carrier_pigeon: 2,
};

const dispatchSchema = z.object({
  recipientId: z.string().min(1, 'A címzett megadása kötelező.'),
  pigeonId: z.string().optional(),
  pigeonIds: z.array(z.string()).optional(),
  content: z.string().min(1, 'A levél tartalma nem lehet üres.'),
  startCoords: z.object({ lat: z.number(), lng: z.number() }).nullish(),
  endCoords: z.object({ lat: z.number(), lng: z.number() }).nullish(),
});

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();

    const body = await req.json();
    const validation = dispatchSchema.safeParse(body);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const errorMsg = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Érvénytelen küldési adatok.';
      return NextResponse.json({ error: errorMsg, details: validation.error.issues }, { status: 400, headers: CORS_HEADERS });
    }

    const { recipientId, pigeonId, pigeonIds, content, startCoords, endCoords } = validation.data;

    // Collect distinct pigeon IDs
    const targetPigeonIds = (pigeonIds && pigeonIds.length > 0)
      ? Array.from(new Set(pigeonIds))
      : (pigeonId ? [pigeonId] : []);

    if (targetPigeonIds.length === 0) {
      return NextResponse.json({ error: 'Legalább egy madarat ki kell választanod a levél kézbesítéséhez!' }, { status: 400, headers: CORS_HEADERS });
    }

    const [sender, recipient, pigeons] = await Promise.all([
      User.findById(auth.userId).lean(),
      User.findById(recipientId).lean(),
      Pigeon.find({ _id: { $in: targetPigeonIds } }),
    ]);

    if (!recipient) return NextResponse.json({ error: 'A címzett nem található!' }, { status: 404, headers: CORS_HEADERS });
    if (pigeons.length !== targetPigeonIds.length) {
      return NextResponse.json({ error: 'Egy vagy több kiválasztott madár nem található!' }, { status: 404, headers: CORS_HEADERS });
    }

    // Verify all pigeons belong to the sender and are idle
    for (const p of pigeons) {
      if (p.ownerId.toString() !== auth.userId) {
        return NextResponse.json({ error: `Nincs jogosultságod ehhez a madárhoz: "${p.name}"!` }, { status: 403, headers: CORS_HEADERS });
      }
      if (p.status !== 'idle') {
        return NextResponse.json({ error: `"${p.name}" jelenleg ${p.status} státuszban van, csak tétlen madár küldhető!` }, { status: 400, headers: CORS_HEADERS });
      }
    }

    // Dynamic character limit: 500 characters per bird in the flock
    const maxAllowedChars = pigeons.length * 500;
    if (content.length > maxAllowedChars) {
      return NextResponse.json(
        {
          error: `A levél hossza (${content.length} karakter) meghaladja a raj (${pigeons.length} madár) kapacitását (${maxAllowedChars} karakter)! Válassz több madarat a rajba vagy rövidítsd a levelet.`,
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Determine the largest bird as leader (size rank, then level)
    const sortedPigeons = [...pigeons].sort((a, b) => {
      const rankA = BIRD_SIZE_RANK[a.species] || 2;
      const rankB = BIRD_SIZE_RANK[b.species] || 2;
      if (rankB !== rankA) return rankB - rankA;
      return (b.level || 1) - (a.level || 1);
    });
    const leaderPigeon = sortedPigeons[0];
    const isFlock = pigeons.length > 1;

    const start = (startCoords && typeof startCoords.lat === 'number' && typeof startCoords.lng === 'number')
      ? startCoords
      : (sender?.location?.lat && sender?.location?.lng 
        ? { lat: sender.location.lat, lng: sender.location.lng } 
        : { lat: 47.4979, lng: 19.0402 });
      
    const end = (endCoords && typeof endCoords.lat === 'number' && typeof endCoords.lng === 'number')
      ? endCoords
      : (recipient?.location?.lat && recipient?.location?.lng 
        ? { lat: recipient.location.lat, lng: recipient.location.lng } 
        : { lat: 47.5, lng: 19.05 });

    const distanceKm = Math.max(1, Math.round(haversineKm(start, end)));
    
    // Flock average speed
    const avgSpeedKmH = Math.round(pigeons.reduce((sum, p) => sum + (p.speedKmH || 80), 0) / pigeons.length);
    const flightDurationMinutes = Math.max(1, Math.round((distanceKm / avgSpeedKmH) * 60));

    // Survival and lost chances: flock provides significant safety synergy
    const highestLevel = Math.max(...pigeons.map(p => p.level || 1));
    const baseDeathChance = Math.min(distanceKm * 0.01 * Math.max(1, 3 - highestLevel), 25);
    const baseLostChance = Math.min(distanceKm * 0.02 * Math.max(1, 3 - highestLevel), 40);

    // Each extra bird reduces death chance by 30% and lost chance by 35%
    const flockSafetyMultiplier = Math.pow(0.65, pigeons.length - 1);
    const deathChance = Math.max(0, Math.round(baseDeathChance * flockSafetyMultiplier * 10) / 10);
    const lostChance = Math.max(1, Math.round(baseLostChance * flockSafetyMultiplier * 10) / 10);

    const dispatchedAt = new Date();
    const estimatedArrivalAt = new Date(dispatchedAt.getTime() + flightDurationMinutes * 60000);

    const message = await Message.create({
      senderId: auth.userId,
      recipientId,
      pigeonId: leaderPigeon._id, // Leader / largest bird is the primary face
      pigeonIds: pigeons.map(p => p._id),
      isFlock,
      flockSize: pigeons.length,
      content,
      startCoords: start,
      endCoords: end,
      distanceKm,
      flightDurationMinutes,
      deathChance,
      lostChance,
      dispatchedAt,
      estimatedArrivalAt,
      senderLocalTime: dispatchedAt.toISOString(),
      status: 'flying',
    });

    // Update all pigeons in flock: status to flying + fatigue
    await Promise.all(
      pigeons.map(async (p) => {
        p.status = 'flying';
        p.fatigue = Math.min(100, (p.fatigue || 0) + Math.round(distanceKm / 10));
        await p.save();
      })
    );

    // Increment sender stats
    await User.findByIdAndUpdate(auth.userId, { $inc: { 'stats.sentCount': 1 } });

    await createLog(
      'info',
      'FlightEngine',
      `Új ${isFlock ? `madárraj (${pigeons.length} madár)` : 'madár'} útnak indítva (${leaderPigeon.name}, ~${distanceKm} km)`,
      { messageId: message._id, senderId: auth.userId, recipientId, pigeonId: leaderPigeon._id, flockSize: pigeons.length }
    );

    // Értesítés küldése a fogadónak (nem blokkolja a válaszadást)
    import('@/lib/push').then(({ sendPushToUser }) => {
      sendPushToUser(
        recipient,
        isFlock ? '🕊️ Madárraj közeledik!' : '🕊️ Új madár érkezik!',
        isFlock 
          ? `${sender?.username || 'Valaki'} egy ${pigeons.length} fős madárrajt indított feléd!`
          : `${sender?.username || 'Valaki'} útnak indított feléd egy madarat!`,
        { type: 'incoming_flight', messageId: message._id.toString() }
      ).catch(console.error);
    });

    return NextResponse.json({
      message: isFlock ? 'Madárraj sikeresen elindítva!' : 'Levél sikeresen elindítva!',
      flightDetails: {
        isFlock,
        flockSize: pigeons.length,
        leaderName: leaderPigeon.name,
        leaderSpecies: leaderPigeon.species,
        distanceKm: Math.round(distanceKm),
        durationMinutes: flightDurationMinutes,
        estimatedArrivalAt,
        deathChance: +deathChance.toFixed(2),
        lostChance: +lostChance.toFixed(2),
      },
    }, { status: 201, headers: CORS_HEADERS });

  } catch (error) {
    console.error('POST /api/messages/dispatch error:', error);
    return NextResponse.json({ error: 'Belső szerver hiba történt a levél küldése közben.' }, { status: 500, headers: CORS_HEADERS });
  }
}
