import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';
import { createLog } from '@/lib/logger';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Kérjük, add meg a jelenlegi jelszavadat!'),
  newPassword: z.string().min(6, 'Az új jelszónak legalább 6 karakter hosszúnak kell lennie!'),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const body = await req.json().catch(() => ({}));
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Érvénytelen adatok' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { currentPassword, newPassword } = validation.data;
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: 'Felhasználó nem található!' }, { status: 404, headers: CORS_HEADERS });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'A jelenlegi jelszó hibás!' }, { status: 400, headers: CORS_HEADERS });
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    user.passwordHash = newPasswordHash;
    await user.save();

    await createLog('info', 'Auth', `Jelszómódosítás: ${user.username} (${user.email})`, { userId: user._id });

    return NextResponse.json(
      { success: true, message: 'A jelszavad sikeresen megváltoztatva!' },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('POST /api/auth/change-password error:', error);
    return NextResponse.json(
      { error: 'Belső szerverhiba történt a jelszó módosítása közben.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
