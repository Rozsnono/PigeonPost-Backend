import { NextRequest, NextResponse } from 'next/server';
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
    // Remove from both sides
    await User.findByIdAndUpdate(auth.userId, {
      $pull: {
        friends: targetUserId,
        sentFriendRequests: targetUserId,
        pendingFriendRequests: targetUserId,
      },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $pull: {
        friends: auth.userId,
        sentFriendRequests: auth.userId,
        pendingFriendRequests: auth.userId,
      },
    });

    return NextResponse.json({ message: 'Removed' }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('DELETE /api/friends/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
