import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';
import { isExpoPushToken } from '@/lib/push';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

// POST /api/user/push-token — az eszköz Expo push tokenjének regisztrálása a bejelentkezett felhasználóhoz.
// Egy token egyszerre csak egy felhasználóhoz tartozhat (közös eszközön fiókváltáskor nem kapja meg más az értesítést).
export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json().catch(() => ({}));
    const pushToken = body?.pushToken;
    if (!isExpoPushToken(pushToken)) {
      return NextResponse.json({ error: 'Érvénytelen pushToken' }, { status: 400, headers: CORS_HEADERS });
    }

    await connectToDatabase();
    const res = await User.updateOne({ _id: auth.userId }, { $set: { expoPushToken: pushToken } });
    if (res.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });
    }
    await User.updateMany(
      { _id: { $ne: auth.userId }, expoPushToken: pushToken },
      { $set: { expoPushToken: null } }
    );

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Update push token error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}

// DELETE /api/user/push-token — kijelentkezéskor leválasztja az eszközt (nincs értesítés kilépett fiókra).
export async function DELETE(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    await User.updateOne({ _id: auth.userId }, { $set: { expoPushToken: null } });
    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Delete push token error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
