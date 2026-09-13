import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

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

function calculateAge(birthday?: Date | string): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();

    const me = await User.findById(auth.userId).lean();
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const gender = searchParams.get('gender')?.trim() || '';
    const language = searchParams.get('language')?.trim() || '';
    const interest = searchParams.get('interest')?.trim() || '';

    const filter: any = {
      _id: { $ne: auth.userId },
      isDeleted: false,
    };

    if (query) {
      filter.$or = [
        { username: { $regex: query, $options: 'i' } },
        { 'location.city': { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } },
        { interests: { $regex: query, $options: 'i' } },
      ];
    }

    if (gender && gender !== 'all') {
      filter.gender = gender;
    }

    if (language) {
      filter['languages.name'] = { $regex: language, $options: 'i' };
    }

    if (interest) {
      filter.interests = { $in: [new RegExp(interest, 'i')] };
    }

    const usersRaw = await User.find(filter)
      .select('username avatar level location isLocationPrivate birthday zodiac gender languages interests bio messagePreferences stats stamps ownedBirds activeBird updatedAt')
      .limit(60)
      .lean();

    const myLat = me.location?.lat || 47.4979;
    const myLng = me.location?.lng || 19.0402;

    const formattedUsers = usersRaw.map((u: any) => {
      let distanceKm: number | null = null;
      if (u.location?.lat && u.location?.lng) {
        distanceKm = calculateHaversineKm(myLat, myLng, u.location.lat, u.location.lng);
      }

      const age = calculateAge(u.birthday);

      return {
        _id: u._id,
        username: u.username,
        avatar: u.avatar || 'feather',
        level: u.level || 1,
        gender: u.gender || 'Person',
        age: age || 24,
        zodiac: u.zodiac || 'Virgo',
        displayLocation: u.isLocationPrivate ? 'Location private' : (u.location?.city || 'Unknown City'),
        city: u.location?.city || 'Unknown City',
        isLocationPrivate: Boolean(u.isLocationPrivate),
        distanceKm,
        languages: u.languages || [{ code: 'hu', name: 'Hungarian', isNative: true }],
        interests: u.interests || [],
        bio: u.bio || '',
        messagePreferences: u.messagePreferences || {
          replyPace: 'No preference',
          messageLength: 'Any length',
          writingAssistance: 'Prefer not to say',
          hereFor: 'Friendship',
        },
        stamps: u.stamps || [],
        stats: {
          journeys: (u.stats?.sentCount || 0) + (u.stats?.receivedCount || 0),
          countries: Math.max(1, (u.stamps?.length || 1)),
          birds: Math.max(1, (u.ownedBirds?.length || 1)),
        },
        activeBird: u.activeBird || 'pigeon',
        isActiveThisMonth: true,
      };
    });

    return NextResponse.json({ users: formattedUsers }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('GET /api/discover error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
