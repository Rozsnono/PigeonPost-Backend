import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/users/search?q=username — search users to add as friends
export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] }, { status: 200, headers: CORS_HEADERS });
  }

  try {
    await connectToDatabase();
    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: auth.userId }, // exclude self
      isDeleted: false,
    })
      .select('_id username level avatar')
      .limit(20)
      .lean();

    return NextResponse.json({ users }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('GET /api/users/search error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
