import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
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

    return NextResponse.json({ user: updatedUser }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('PATCH /api/users/me error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
