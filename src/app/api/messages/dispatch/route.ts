import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';
import { z } from 'zod';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const dispatchSchema = z.object({
  recipientId: z.string(),
  pigeonId: z.string(),
  content: z.string().min(1).max(500),
  // Coords are optional for now — default to Budapest
  startCoords: z.object({ lat: z.number(), lng: z.number() }).optional(),
  endCoords: z.object({ lat: z.number(), lng: z.number() }).optional(),
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
      return NextResponse.json({ error: 'Invalid data', details: validation.error.issues }, { status: 400, headers: CORS_HEADERS });
    }

    const { recipientId, pigeonId, content, startCoords, endCoords } = validation.data;

    const [recipient, pigeon] = await Promise.all([
      User.findById(recipientId).lean(),
      Pigeon.findById(pigeonId),
    ]);

    if (!recipient) return NextResponse.json({ error: 'Recipient not found' }, { status: 404, headers: CORS_HEADERS });
    if (!pigeon || pigeon.ownerId.toString() !== auth.userId) {
      return NextResponse.json({ error: 'Pigeon not found or unauthorized' }, { status: 404, headers: CORS_HEADERS });
    }
    if (pigeon.status !== 'idle') {
      return NextResponse.json({ error: `Pigeon is ${pigeon.status} — choose an idle courier` }, { status: 400, headers: CORS_HEADERS });
    }

    const start = startCoords ?? { lat: 47.4979, lng: 19.0402 };
    const end = endCoords ?? { lat: 47.5, lng: 19.05 };
    const distanceKm = haversineKm(start, end);
    const flightDurationMinutes = Math.round((distanceKm / 100) * 60); // 100 km/h base speed
    const deathChance = Math.min(distanceKm * 0.01 * Math.max(1, 3 - pigeon.level), 25);
    const lostChance = Math.min(distanceKm * 0.02 * Math.max(1, 3 - pigeon.level), 40);

    const dispatchedAt = new Date();
    const estimatedArrivalAt = new Date(dispatchedAt.getTime() + flightDurationMinutes * 60000);

    const message = await Message.create({
      senderId: auth.userId,
      recipientId,
      pigeonId,
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

    // Update pigeon status + fatigue
    pigeon.status = 'flying';
    pigeon.fatigue = Math.min(100, pigeon.fatigue + Math.round(distanceKm / 10));
    await pigeon.save();

    // Increment sender stats
    await User.findByIdAndUpdate(auth.userId, { $inc: { 'stats.sentCount': 1 } });

    return NextResponse.json({
      message: 'Letter dispatched!',
      flightDetails: {
        distanceKm: Math.round(distanceKm),
        durationMinutes: flightDurationMinutes,
        estimatedArrivalAt,
        deathChance: +deathChance.toFixed(2),
        lostChance: +lostChance.toFixed(2),
      },
    }, { status: 201, headers: CORS_HEADERS });

  } catch (error) {
    console.error('POST /api/messages/dispatch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
