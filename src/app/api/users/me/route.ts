import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
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
        city: String(body.location.city || 'Budapest').trim().replace(/\s+Dúc$/i, ''),
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

    if (body.bio !== undefined) {
      updateFields.bio = String(body.bio || '').slice(0, 500);
    }

    if (body.birthday) {
      const bDate = new Date(body.birthday);
      if (!isNaN(bDate.getTime())) {
        updateFields.birthday = bDate;
        const day = bDate.getDate();
        const month = bDate.getMonth() + 1;
        // Calculate zodiac sign
        const zodiacSigns = [
          { name: 'Capricorn', m: 1, d: 20 },
          { name: 'Aquarius', m: 2, d: 19 },
          { name: 'Pisces', m: 3, d: 21 },
          { name: 'Aries', m: 4, d: 20 },
          { name: 'Taurus', m: 5, d: 21 },
          { name: 'Gemini', m: 6, d: 21 },
          { name: 'Cancer', m: 7, d: 23 },
          { name: 'Leo', m: 8, d: 23 },
          { name: 'Virgo', m: 9, d: 23 },
          { name: 'Libra', m: 10, d: 23 },
          { name: 'Scorpio', m: 11, d: 22 },
          { name: 'Sagittarius', m: 12, d: 22 },
        ];
        let sign = 'Capricorn';
        for (const s of zodiacSigns) {
          if (month === s.m && day < s.d) {
            sign = s.name;
            break;
          }
        }
        updateFields.zodiac = body.zodiac || sign;
      }
    } else if (body.zodiac !== undefined) {
      updateFields.zodiac = String(body.zodiac);
    }

    if (body.gender !== undefined) {
      updateFields.gender = String(body.gender);
    }

    if (typeof body.isLocationPrivate === 'boolean') {
      updateFields.isLocationPrivate = body.isLocationPrivate;
    }

    if (Array.isArray(body.languages)) {
      updateFields.languages = body.languages.map((l: any) => ({
        code: String(l.code || 'hu'),
        name: String(l.name || 'Hungarian'),
        isNative: Boolean(l.isNative),
      }));
    }

    if (Array.isArray(body.interests)) {
      updateFields.interests = body.interests.map(String).slice(0, 30);
    }

    if (body.messagePreferences && typeof body.messagePreferences === 'object') {
      updateFields.messagePreferences = {
        replyPace: String(body.messagePreferences.replyPace || 'No preference'),
        messageLength: String(body.messagePreferences.messageLength || 'Any length'),
        writingAssistance: String(body.messagePreferences.writingAssistance || 'Prefer not to say'),
        hereFor: String(body.messagePreferences.hereFor || 'Friendship'),
      };
    }

    if (body.activeBird && typeof body.activeBird === 'string') {
      updateFields.activeBird = body.activeBird;
    }

    if (typeof body.gold === 'number') {
      updateFields.gold = Math.max(0, body.gold);
    }

    if (body.pinColor && typeof body.pinColor === 'string') {
      updateFields.pinColor = body.pinColor;
    }

    if (body.newPassword) {
      if (typeof body.newPassword !== 'string' || body.newPassword.length < 6) {
        return NextResponse.json({ error: 'Az új jelszónak legalább 6 karakternek kell lennie!' }, { status: 400, headers: CORS_HEADERS });
      }
      const existingUser = await User.findById(auth.userId);
      if (!existingUser) {
        return NextResponse.json({ error: 'Felhasználó nem található!' }, { status: 404, headers: CORS_HEADERS });
      }
      if (!body.currentPassword) {
        return NextResponse.json({ error: 'A jelenlegi jelszó megadása kötelező!' }, { status: 400, headers: CORS_HEADERS });
      }
      const isMatch = await bcrypt.compare(body.currentPassword, existingUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'A jelenlegi jelszó hibás!' }, { status: 400, headers: CORS_HEADERS });
      }
      updateFields.passwordHash = await bcrypt.hash(body.newPassword, 10);
      await createLog('info', 'Auth', `Jelszómódosítás (profile PATCH): ${existingUser.username}`, { userId: existingUser._id });
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

