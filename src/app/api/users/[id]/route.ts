import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/users/[id] — get a user's public profile, stats, and pigeon count
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  const { id } = await params;

  try {
    await connectToDatabase();

    const [user, pigeonCount] = await Promise.all([
      User.findById(id).select('username avatar level stats createdAt friends location').lean(),
      Pigeon.countDocuments({ ownerId: id }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });
    }

    const isFriend = Array.isArray(user.friends) && user.friends.some((f: any) => f.toString() === auth.userId);

    return NextResponse.json(
      {
        user: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          level: user.level,
          stats: user.stats || { sentCount: 0, receivedCount: 0, maxDistance: 0 },
          location: (user as any).location,
          createdAt: user.createdAt,
          pigeonCount,
          isFriend,
        },
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
