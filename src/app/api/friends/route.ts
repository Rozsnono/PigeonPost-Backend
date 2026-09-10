import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/friends — list my friends + pending incoming requests
export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const me = await User.findById(auth.userId)
      .populate({ path: 'friends', select: '_id username level avatar location', strictPopulate: false })
      .populate({ path: 'pendingFriendRequests', select: '_id username level avatar location', strictPopulate: false })
      .populate({ path: 'sentFriendRequests', select: '_id username level avatar location', strictPopulate: false })
      .lean();

    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    // Szűrjük ki az esetleges saját ID-t a listákból (adatintegritás)
    const filterSelf = (arr: any[]) =>
      (arr ?? []).filter((u: any) => u._id?.toString() !== auth.userId && u !== auth.userId);

    return NextResponse.json({
      friends: filterSelf(me.friends as any[]),
      pendingRequests: filterSelf(me.pendingFriendRequests as any[]),
      sentRequests: filterSelf(me.sentFriendRequests as any[]),
    }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('GET /api/friends error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}

// POST /api/friends — send a friend request { targetUserId }
export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const { targetUserId } = await req.json();
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId required' }, { status: 400, headers: CORS_HEADERS });
    if (targetUserId === auth.userId) return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400, headers: CORS_HEADERS });

    const [me, target] = await Promise.all([
      User.findById(auth.userId),
      User.findById(targetUserId),
    ]);
    if (!me || !target) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    const alreadyFriends = me.friends.some((id: any) => id.toString() === targetUserId);
    const alreadySent = me.sentFriendRequests.some((id: any) => id.toString() === targetUserId);
    if (alreadyFriends) return NextResponse.json({ error: 'Already friends' }, { status: 409, headers: CORS_HEADERS });
    if (alreadySent) return NextResponse.json({ error: 'Request already sent' }, { status: 409, headers: CORS_HEADERS });

    // If target already sent me a request → auto-accept
    const targetSentMe = target.sentFriendRequests.some((id: any) => id.toString() === auth.userId);
    if (targetSentMe) {
      // Accept: add both as friends, clean up all request arrays on both sides
      await User.findByIdAndUpdate(auth.userId, {
        $addToSet: { friends: targetUserId },
        $pull: { pendingFriendRequests: targetUserId, sentFriendRequests: targetUserId },
      });
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { friends: auth.userId },
        $pull: { sentFriendRequests: auth.userId, pendingFriendRequests: auth.userId },
      });
      return NextResponse.json({ message: 'Friend request accepted — you are now friends!' }, { status: 200, headers: CORS_HEADERS });
    }

    // Normal send
    await User.findByIdAndUpdate(auth.userId, { $addToSet: { sentFriendRequests: targetUserId } });
    await User.findByIdAndUpdate(targetUserId, { $addToSet: { pendingFriendRequests: auth.userId } });

    return NextResponse.json({ message: 'Friend request sent' }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    console.error('POST /api/friends error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
