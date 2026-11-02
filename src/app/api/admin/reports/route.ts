import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Report from '@/models/Report';
import { isAdminRequest } from '@/lib/adminAuth';
import { revokeAllRefreshTokens } from '@/lib/tokens';
import { createLog } from '@/lib/logger';

// GET /api/admin/reports?status=open|resolved|dismissed|all
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await connectToDatabase();
    const status = req.nextUrl.searchParams.get('status') || 'open';
    const filter = status === 'all' ? {} : { status };
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('reporterId', 'username')
      .populate('targetUserId', 'username email status')
      .populate('messageId', 'content')
      .lean();
    return NextResponse.json(reports);
  } catch (error) {
    console.error('GET /api/admin/reports error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

const patchSchema = z.object({
  id: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v)),
  action: z.enum(['resolve', 'dismiss', 'ban']),
  note: z.string().trim().max(500).optional(),
});

// PATCH /api/admin/reports — lezárás, elvetés vagy a jelentett felhasználó tiltása
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Érvénytelen adatok' }, { status: 400 });
    const { id, action, note } = parsed.data;

    await connectToDatabase();
    const report = await Report.findById(id);
    if (!report) return NextResponse.json({ error: 'A jelentés nem található' }, { status: 404 });

    if (action === 'ban') {
      await User.updateOne(
        { _id: report.targetUserId },
        { $set: { status: 'banned', bannedAt: new Date(), banReason: note || `Jelentés alapján (${report.reason})` } }
      );
      await revokeAllRefreshTokens(String(report.targetUserId));
      await createLog('warn', 'Moderáció', 'Felhasználó letiltva jelentés alapján', { targetUserId: report.targetUserId, reportId: id });
    }

    report.status = action === 'dismiss' ? 'dismissed' : 'resolved';
    report.resolutionNote = note ?? '';
    report.resolvedAt = new Date();
    await report.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/reports error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
