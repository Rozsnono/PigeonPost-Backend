import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Message from '@/models/Message';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';
import { createLog } from '@/lib/logger';

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

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const user = await User.findById(auth.userId)
      .select('-passwordHash')
      .lean();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    return NextResponse.json({ user }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('GET /api/users/me error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const body = await req.json();

    const updateFields: any = {};

    if (body.location) {
      updateFields.location = {
        city: String(body.location.city || 'Ismeretlen Dúc'),
        lat: Number(body.location.lat) || 47.4979,
        lng: Number(body.location.lng) || 19.0402,
        updatedAt: new Date(),
      };
    }

    if (typeof body.hasCompletedOnboarding === 'boolean') {
      updateFields.hasCompletedOnboarding = body.hasCompletedOnboarding;
    }

    if (body.avatar && typeof body.avatar === 'string') {
      updateFields.avatar = body.avatar;
    }

    if (body.expoPushToken !== undefined) {
      updateFields.expoPushToken = typeof body.expoPushToken === 'string' ? body.expoPushToken : null;
    }

    const updatedUser = await User.findByIdAndUpdate(
      auth.userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .select('-passwordHash')
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });
    }

    // Dynamic In-Flight Pigeon Redirection
    // If the user's location has changed, all pigeons flying towards this user
    // (or returning pigeons if user is the sender) dynamically turn and fly towards the new location!
    if (updateFields.location) {
      const now = new Date();
      const newDestLat = updateFields.location.lat;
      const newDestLng = updateFields.location.lng;

      // 1. In-flight incoming messages heading towards this recipient
      const inFlightIncoming = await Message.find({
        recipientId: auth.userId,
        status: 'flying',
      });

      for (const msg of inFlightIncoming) {
        const dispatchedTime = new Date(msg.dispatchedAt).getTime();
        const arrivalTime = new Date(msg.estimatedArrivalAt).getTime();
        const totalDuration = Math.max(1, arrivalTime - dispatchedTime);
        const elapsed = Math.max(0, now.getTime() - dispatchedTime);
        const ratio = Math.min(0.99, Math.max(0, elapsed / totalDuration));

        // Interpolate current pigeon position in mid-air
        const currentLat = msg.startCoords.lat + (msg.endCoords.lat - msg.startCoords.lat) * ratio;
        const currentLng = msg.startCoords.lng + (msg.endCoords.lng - msg.startCoords.lng) * ratio;

        // Recalculate remaining distance to new recipient position
        const newRemainingKm = calculateHaversineKm(currentLat, currentLng, newDestLat, newDestLng);
        // Base pigeon flight speed: 100 km/h (1.666 km/min)
        const newRemainingMinutes = Math.max(1, Math.round((newRemainingKm / 100) * 60));
        const newEstimatedArrivalAt = new Date(now.getTime() + newRemainingMinutes * 60 * 1000);

        await createLog(
          'info',
          'PigeonRedirect',
          `Pigeon for message ${msg._id} dynamically redirected in mid-air from (${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}) towards new location (${newDestLat.toFixed(4)}, ${newDestLng.toFixed(4)}), remaining: ${newRemainingKm} km`,
          { messageId: msg._id, newRemainingKm, newDestLat, newDestLng }
        );

        // Update message flight path: start is current mid-air position, end is new destination
        msg.startCoords = { lat: currentLat, lng: currentLng };
        msg.endCoords = { lat: newDestLat, lng: newDestLng };
        msg.dispatchedAt = now;
        msg.estimatedArrivalAt = newEstimatedArrivalAt;
        msg.distanceKm = newRemainingKm;
        msg.flightDurationMinutes = newRemainingMinutes;
        await msg.save();
      }

      // 2. Returning messages heading back to this sender's loft
      const returningMessages = await Message.find({
        senderId: auth.userId,
        returningStatus: 'returning',
      });

      for (const msg of returningMessages) {
        if (!msg.returnDispatchedAt || !msg.returnEstimatedArrivalAt) continue;
        const dispatchedTime = new Date(msg.returnDispatchedAt).getTime();
        const arrivalTime = new Date(msg.returnEstimatedArrivalAt).getTime();
        const totalDuration = Math.max(1, arrivalTime - dispatchedTime);
        const elapsed = Math.max(0, now.getTime() - dispatchedTime);
        const ratio = Math.min(0.99, Math.max(0, elapsed / totalDuration));

        // In returning flight, pigeon flies from endCoords (recipient) to startCoords (sender loft)
        const currentLat = msg.endCoords.lat + (msg.startCoords.lat - msg.endCoords.lat) * ratio;
        const currentLng = msg.endCoords.lng + (msg.startCoords.lng - msg.endCoords.lng) * ratio;

        const newRemainingKm = calculateHaversineKm(currentLat, currentLng, newDestLat, newDestLng);
        // Returning speed is 2x: 200 km/h
        const newRemainingMinutes = Math.max(1, Math.round((newRemainingKm / 200) * 60));
        const newEstimatedArrivalAt = new Date(now.getTime() + newRemainingMinutes * 60 * 1000);

        msg.endCoords = { lat: currentLat, lng: currentLng };
        msg.startCoords = { lat: newDestLat, lng: newDestLng };
        msg.returnDispatchedAt = now;
        msg.returnEstimatedArrivalAt = newEstimatedArrivalAt;
        await msg.save();
      }
    }

    return NextResponse.json({ user: updatedUser }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('PATCH /api/users/me error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}

