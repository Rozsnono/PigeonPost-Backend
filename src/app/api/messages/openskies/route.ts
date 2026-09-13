import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import Message from '@/models/Message';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';
import { AVIARY_SPECIES } from '@/app/api/aviary/route';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return Math.max(1, Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
}

// POST /api/messages/openskies — Release to the wind (Wandering message)
export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const sender = await User.findById(auth.userId);
    if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404, headers: CORS_HEADERS });

    const body = await req.json();
    const content = String(body.content || '').trim();
    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400, headers: CORS_HEADERS });
    }

    // Check Open Skies quota
    const quota = sender.openSkiesQuota || { remaining: 20, max: 20 };
    if (quota.remaining <= 0) {
      return NextResponse.json(
        { error: 'Open Skies kvóta kimerült mára! Próbáld újra holnap.' },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    // Find random eligible recipient
    const randomUsers = await User.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(auth.userId) }, isDeleted: false } },
      { $sample: { size: 1 } },
    ]);

    if (!randomUsers || randomUsers.length === 0) {
      return NextResponse.json(
        { error: 'Nem található elérhető címzett a hálózatban jelenleg.' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const recipient = randomUsers[0];

    // Find or get sender's active carrier bird
    const activeBirdId = sender.activeBird || 'pigeon';
    const spec = AVIARY_SPECIES.find((s) => s.id === activeBirdId) || AVIARY_SPECIES[0];
    const speed = spec.speedKmH;

    let pigeon = await Pigeon.findOne({ ownerId: sender._id, status: 'idle' });
    if (!pigeon) {
      // Create a pigeon record if none available
      pigeon = await Pigeon.create({
        ownerId: sender._id,
        name: spec.name,
        identifier: '#' + Math.floor(1000 + Math.random() * 9000),
        species: spec.id,
        speedKmH: spec.speedKmH,
        status: 'flying',
      });
    } else {
      pigeon.status = 'flying';
      pigeon.species = spec.id;
      pigeon.speedKmH = spec.speedKmH;
      await pigeon.save();
    }

    const startLat = sender.location?.lat || 47.4979;
    const startLng = sender.location?.lng || 19.0402;
    const endLat = recipient.location?.lat || 46.253;
    const endLng = recipient.location?.lng || 20.1414;

    const distanceKm = calculateHaversineKm(startLat, startLng, endLat, endLng);
    const durationMinutes = Math.max(1, Math.round((distanceKm / speed) * 60));

    const now = new Date();
    const estimatedArrivalAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const message = await Message.create({
      senderId: sender._id,
      recipientId: recipient._id,
      pigeonId: pigeon._id,
      content,
      status: 'flying',
      isOpenSkies: true,
      attachedStampId: sender.stamps?.[0]?.id || 'stamp_hu_01',
      startCoords: { lat: startLat, lng: startLng },
      endCoords: { lat: endLat, lng: endLng },
      distanceKm,
      flightDurationMinutes: durationMinutes,
      dispatchedAt: now,
      estimatedArrivalAt,
      senderLocalTime: now.toISOString(),
      deathChance: 0,
      lostChance: 1.5,
    });

    // Decrement quota
    sender.openSkiesQuota = {
      remaining: Math.max(0, quota.remaining - 1),
      max: quota.max || 20,
      resetAt: quota.resetAt || now,
    };
    sender.stats = {
      ...sender.stats,
      sentCount: (sender.stats?.sentCount || 0) + 1,
    };
    await sender.save();

    return NextResponse.json(
      {
        success: true,
        message,
        remainingQuota: sender.openSkiesQuota.remaining,
        carrierBird: spec.name,
        speedKmH: spec.speedKmH,
        estimatedMinutes: durationMinutes,
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('POST /api/messages/openskies error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
