import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Message from '@/models/Message';
import Report, { REPORT_REASONS } from '@/models/Report';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { createLog } from '@/lib/logger';

const schema = z.object({
  targetUserId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), 'Érvénytelen felhasználó'),
  messageId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v)).optional(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(1000).optional(),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// POST /api/reports — felhasználó vagy levél jelentése a moderátoroknak.
export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    if (!rateLimit(`report:${auth.userId}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Túl sok jelentés. Próbáld újra később.' }, { status: 429, headers: CORS_HEADERS });
    }
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Érvénytelen adatok', details: parsed.error.issues }, { status: 400, headers: CORS_HEADERS });
    }
    const { targetUserId, messageId, reason, details } = parsed.data;

    if (targetUserId === auth.userId) {
      return NextResponse.json({ error: 'Saját magadat nem jelentheted.' }, { status: 400, headers: CORS_HEADERS });
    }

    await connectToDatabase();
    const target = await User.exists({ _id: targetUserId, isDeleted: { $ne: true } });
    if (!target) {
      return NextResponse.json({ error: 'A felhasználó nem található.' }, { status: 404, headers: CORS_HEADERS });
    }

    // Levél jelentésekor ellenőrizzük, hogy a jelentő valóban részese a levélnek és a feladó a jelentett
    if (messageId) {
      const msg = await Message.findById(messageId).select('senderId recipientId').lean<{ senderId: mongoose.Types.ObjectId; recipientId: mongoose.Types.ObjectId } | null>();
      const involved = msg && String(msg.recipientId) === auth.userId && String(msg.senderId) === targetUserId;
      if (!involved) {
        return NextResponse.json({ error: 'Ez a levél nem jelenthető.' }, { status: 403, headers: CORS_HEADERS });
      }
    }

    // Ismételt jelentés ugyanarról 24 órán belül: nem duplikáljuk
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const duplicate = await Report.exists({ reporterId: auth.userId, targetUserId, status: 'open', createdAt: { $gte: since } });
    if (!duplicate) {
      await Report.create({ reporterId: auth.userId, targetUserId, messageId: messageId ?? null, reason, details: details ?? '' });
      await createLog('warn', 'Moderáció', `Új jelentés (${reason})`, { reporterId: auth.userId, targetUserId, messageId });
    }

    return NextResponse.json({ success: true, message: 'Köszönjük, a jelentést megkaptuk.' }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    console.error('POST /api/reports error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
