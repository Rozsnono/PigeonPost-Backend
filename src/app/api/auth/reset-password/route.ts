import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { CORS_HEADERS } from '@/lib/auth';
import { escapeRegex } from '@/lib/escapeRegex';
import { getClientIp, rateLimit } from '@/lib/rateLimit';
import { revokeAllRefreshTokens } from '@/lib/tokens';
import { createLog } from '@/lib/logger';
import { hashResetCode } from '@/lib/passwordReset';

const MAX_ATTEMPTS = 5;
const schema = z.object({
  email: z.string().trim().email().max(100),
  code: z.string().trim().regex(/^\d{6}$/),
  newPassword: z.string().min(6).max(200),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// POST /api/auth/reset-password — a kóddal új jelszót állít be, és minden munkamenetet visszavon.
export async function POST(req: NextRequest) {
  const invalid = () =>
    NextResponse.json({ error: 'Érvénytelen vagy lejárt kód.' }, { status: 400, headers: CORS_HEADERS });
  try {
    if (!rateLimit(`reset-ip:${getClientIp(req)}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Túl sok kérés. Próbáld újra később.' }, { status: 429, headers: CORS_HEADERS });
    }
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Érvénytelen adatok (a kód 6 számjegy, a jelszó legalább 6 karakter).' }, { status: 400, headers: CORS_HEADERS });
    }
    const { email, code, newPassword } = parsed.data;

    await connectToDatabase();
    const user = await User.findOne({
      email: new RegExp(`^${escapeRegex(email)}$`, 'i'),
      isDeleted: { $ne: true },
    }).select('+passwordReset');
    const reset = user?.passwordReset;
    if (!user || !reset || reset.expiresAt < new Date() || reset.attempts >= MAX_ATTEMPTS) return invalid();

    const expected = Buffer.from(reset.codeHash);
    const actual = Buffer.from(hashResetCode(code, String(user._id)));
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      await User.updateOne({ _id: user._id }, { $inc: { 'passwordReset.attempts': 1 } });
      return invalid();
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordReset = undefined;
    await user.save();
    await revokeAllRefreshTokens(String(user._id));
    await createLog('info', 'Auth', `Jelszó visszaállítva kóddal: ${user.username}`, { userId: user._id });

    return NextResponse.json({ success: true, message: 'Az új jelszavad beállítva. Jelentkezz be.' }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('[auth/reset-password] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
