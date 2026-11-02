import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { z } from 'zod';
import { createLog } from '@/lib/logger';
import { CORS_HEADERS } from '@/lib/auth';
import { escapeRegex } from '@/lib/escapeRegex';
import { getClientIp, rateLimit } from '@/lib/rateLimit';
import { signAccessToken, issueRefreshToken } from '@/lib/tokens';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(3).max(100),
  password: z.string().min(6).max(200),
});

// Handle CORS preflight requests from mobile
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    // Brute force védelem: IP-nként 20 próbálkozás / 15 perc
    if (!rateLimit(`login:${getClientIp(req)}`, 20, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Túl sok bejelentkezési kísérlet. Próbáld újra később.' },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    await connectToDatabase();

    const body = await req.json().catch(() => null);
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.issues },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { usernameOrEmail, password } = validation.data;

    // Find user by username OR email (case-insensitive, a bemenet escape-elve)
    const searchRegex = new RegExp(`^${escapeRegex(usernameOrEmail.trim())}$`, 'i');
    const user = await User.findOne({
      $or: [{ email: searchRegex }, { username: searchRegex }],
    });

    // Egységes hibaüzenet: nem derül ki, hogy a felhasználó létezik-e
    const invalid = () =>
      NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: CORS_HEADERS });

    if (!user || user.isDeleted) return invalid();

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await createLog('warn', 'Auth', `Sikertelen bejelentkezés: ${user.username}`, { userId: user._id });
      return invalid();
    }

    // Check if user is banned (a séma jelenleg nem tartalmaz status mezőt; előre-kompatibilis ellenőrzés)
    if ((user as { status?: string }).status === 'banned') {
      return NextResponse.json({ error: 'Account is banned' }, { status: 403, headers: CORS_HEADERS });
    }

    const token = signAccessToken(user);
    const refreshToken = await issueRefreshToken(String(user._id));

    await createLog('info', 'Auth', `Sikeres bejelentkezés: ${user.username}`, { userId: user._id });

    return NextResponse.json(
      {
        message: 'Login successful',
        token,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('[login/route] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
