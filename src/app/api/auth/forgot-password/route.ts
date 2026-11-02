import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { CORS_HEADERS } from '@/lib/auth';
import { escapeRegex } from '@/lib/escapeRegex';
import { getClientIp, rateLimit } from '@/lib/rateLimit';
import { sendMail } from '@/lib/mailer';
import { createLog } from '@/lib/logger';
import { hashResetCode } from '@/lib/passwordReset';

const CODE_TTL_MS = 30 * 60 * 1000;
const schema = z.object({ email: z.string().trim().email().max(100) });

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// POST /api/auth/forgot-password — 6 jegyű visszaállító kódot küld emailben.
// A válasz mindig ugyanaz (nem derül ki, hogy létezik-e a cím).
export async function POST(req: NextRequest) {
  const generic = NextResponse.json(
    { message: 'Ha létezik fiók ezzel az email címmel, elküldtük a visszaállító kódot.' },
    { status: 200, headers: CORS_HEADERS }
  );
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Érvénytelen email cím' }, { status: 400, headers: CORS_HEADERS });
    }
    const email = parsed.data.email;
    if (!rateLimit(`forgot-ip:${getClientIp(req)}`, 10, 60 * 60 * 1000) || !rateLimit(`forgot-mail:${email.toLowerCase()}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Túl sok kérés. Próbáld újra később.' }, { status: 429, headers: CORS_HEADERS });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i'), isDeleted: { $ne: true } });
    if (!user || user.status === 'banned') return generic;

    const code = String(crypto.randomInt(100000, 1000000));
    await User.updateOne(
      { _id: user._id },
      { $set: { passwordReset: { codeHash: hashResetCode(code, String(user._id)), expiresAt: new Date(Date.now() + CODE_TTL_MS), attempts: 0 } } }
    );

    const sent = await sendMail(
      user.email,
      'PigeonPost – jelszó-visszaállítás',
      `Szia ${user.username}!\n\nA jelszó-visszaállító kódod: ${code}\nEz 30 percig érvényes.\n\nHa nem te kérted, nyugodtan hagyd figyelmen kívül ezt a levelet.`
    );
    if (!sent) {
      await createLog('error', 'Auth', `Jelszó-visszaállító email nem ment ki: ${user.username}`, { userId: user._id });
    }
    return generic;
  } catch (error) {
    console.error('[auth/forgot-password] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
