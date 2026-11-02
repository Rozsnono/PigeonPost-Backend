import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

const DEFAULTS = {
  enabled: true,
  quietHours: { enabled: false, startHour: 22, endHour: 7, tzOffsetMinutes: 0 },
};

const settingsSchema = z.object({
  enabled: z.boolean(),
  quietHours: z.object({
    enabled: z.boolean(),
    startHour: z.number().int().min(0).max(23),
    endHour: z.number().int().min(0).max(23),
    tzOffsetMinutes: z.number().int().min(-840).max(840),
  }),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/user/notification-settings
export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();
  try {
    await connectToDatabase();
    const user = await User.findById(auth.userId).select('notificationPrefs').lean<{
      notificationPrefs?: typeof DEFAULTS;
    }>();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });
    return NextResponse.json(
      {
        enabled: user.notificationPrefs?.enabled ?? DEFAULTS.enabled,
        quietHours: { ...DEFAULTS.quietHours, ...(user.notificationPrefs?.quietHours ?? {}) },
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('GET /api/user/notification-settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}

// PUT /api/user/notification-settings
export async function PUT(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();
  try {
    const validation = settingsSchema.safeParse(await req.json().catch(() => null));
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid data', details: validation.error.issues }, { status: 400, headers: CORS_HEADERS });
    }
    await connectToDatabase();
    const res = await User.updateOne({ _id: auth.userId }, { $set: { notificationPrefs: validation.data } });
    if (res.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });
    }
    return NextResponse.json(validation.data, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('PUT /api/user/notification-settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
