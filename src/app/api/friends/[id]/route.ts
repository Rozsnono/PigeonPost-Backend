import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// DELETE /api/friends/[id] — remove friend or decline/cancel request
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  const { id: targetUserId } = await params;

  try {
    await connectToDatabase();

    const authObjId = new mongoose.Types.ObjectId(auth.userId);
    const targetObjId = new mongoose.Types.ObjectId(targetUserId);

    // Remove from both sides (supporting both ObjectId and string representation in DB)
    await User.findByIdAndUpdate(authObjId, {
      $pull: {
        friends: { $in: [targetObjId, targetUserId] },
        sentFriendRequests: { $in: [targetObjId, targetUserId] },
        pendingFriendRequests: { $in: [targetObjId, targetUserId] },
      },
    });
    await User.findByIdAndUpdate(targetObjId, {
      $pull: {
        friends: { $in: [authObjId, auth.userId] },
        sentFriendRequests: { $in: [authObjId, auth.userId] },
        pendingFriendRequests: { $in: [authObjId, auth.userId] },
      },
    });

    return NextResponse.json({ message: 'Removed' }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('DELETE /api/friends/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
