import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/friends — list my friends + pending incoming requests + sent outgoing requests
export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const me = await User.findById(auth.userId)
      .populate({
        path: 'friends',
        match: { isDeleted: false },
        select: '_id username level avatar location',
        strictPopulate: false,
      })
      .populate({
        path: 'pendingFriendRequests',
        match: { isDeleted: false },
        select: '_id username level avatar location',
        strictPopulate: false,
      })
      .populate({
        path: 'sentFriendRequests',
        match: { isDeleted: false },
        select: '_id username level avatar location',
        strictPopulate: false,
      })
      .lean();

    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    // Filter out nulls (e.g. deleted users), non-objects, and self (data integrity)
    const cleanList = (arr: any[]) =>
      (arr ?? []).filter((u: any) => u && typeof u === 'object' && u._id && u._id.toString() !== auth.userId);

    return NextResponse.json({
      friends: cleanList(me.friends as any[]),
      pendingRequests: cleanList(me.pendingFriendRequests as any[]),
      sentRequests: cleanList(me.sentFriendRequests as any[]),
    }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('GET /api/friends error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}

// POST /api/friends — send a friend request or accept incoming request { targetUserId }
export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const { targetUserId } = await req.json();
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId required' }, { status: 400, headers: CORS_HEADERS });
    if (targetUserId === auth.userId) return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400, headers: CORS_HEADERS });

    const authObjId = new mongoose.Types.ObjectId(auth.userId);
    const targetObjId = new mongoose.Types.ObjectId(targetUserId);

    const [me, target] = await Promise.all([
      User.findById(authObjId),
      User.findById(targetObjId),
    ]);
    if (!me || !target) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    const alreadyFriends = me.friends?.some((id: any) => id.toString() === targetUserId);
    if (alreadyFriends) return NextResponse.json({ error: 'Already friends' }, { status: 409, headers: CORS_HEADERS });

    // Check if there is an incoming request from target to me (or if target recorded sending to me)
    const targetSentMe = target.sentFriendRequests?.some((id: any) => id.toString() === auth.userId);
    const iHavePendingFromTarget = me.pendingFriendRequests?.some((id: any) => id.toString() === targetUserId);

    if (targetSentMe || iHavePendingFromTarget) {
      // Accept: add both as mutual friends, clean up all request arrays on both sides
      await User.findByIdAndUpdate(authObjId, {
        $addToSet: { friends: targetObjId },
        $pull: {
          pendingFriendRequests: { $in: [targetObjId, targetUserId] },
          sentFriendRequests: { $in: [targetObjId, targetUserId] },
        },
      });
      await User.findByIdAndUpdate(targetObjId, {
        $addToSet: { friends: authObjId },
        $pull: {
          pendingFriendRequests: { $in: [authObjId, auth.userId] },
          sentFriendRequests: { $in: [authObjId, auth.userId] },
        },
      });
      return NextResponse.json({ message: 'Friend request accepted — you are now friends!' }, { status: 200, headers: CORS_HEADERS });
    }

    const alreadySent = me.sentFriendRequests?.some((id: any) => id.toString() === targetUserId);
    if (alreadySent) return NextResponse.json({ error: 'Request already sent' }, { status: 409, headers: CORS_HEADERS });

    // Normal send: add target to my sent, add me to target's pending
    await User.findByIdAndUpdate(authObjId, {
      $addToSet: { sentFriendRequests: targetObjId },
      $pull: { pendingFriendRequests: { $in: [targetObjId, targetUserId] } },
    });
    await User.findByIdAndUpdate(targetObjId, {
      $addToSet: { pendingFriendRequests: authObjId },
      $pull: { sentFriendRequests: { $in: [authObjId, auth.userId] } },
    });

    return NextResponse.json({ message: 'Friend request sent' }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    console.error('POST /api/friends error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
