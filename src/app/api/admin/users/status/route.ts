import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { isAdminRequest } from '@/lib/adminAuth';
import { revokeAllRefreshTokens } from '@/lib/tokens';
import { createLog } from '@/lib/logger';

const schema = z.object({
  userId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v)),
  status: z.enum(['active', 'banned']),
  reason: z.string().trim().max(300).optional(),
});

// POST /api/admin/users/status — felhasználó tiltása / tiltás feloldása (a törlés külön művelet)
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Érvénytelen adatok' }, { status: 400 });
    const { userId, status, reason } = parsed.data;

    await connectToDatabase();
    const banned = status === 'banned';
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { status, bannedAt: banned ? new Date() : null, banReason: banned ? reason ?? '' : '' } },
      { new: true }
    );
    if (!user) return NextResponse.json({ error: 'Felhasználó nem található' }, { status: 404 });
    if (banned) await revokeAllRefreshTokens(userId);

    await createLog('warn', 'Admin', `${banned ? 'Letiltva' : 'Tiltás feloldva'}: ${user.username}`, { userId, reason });
    return NextResponse.json({ success: true, status: user.status });
  } catch (error) {
    console.error('POST /api/admin/users/status error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
