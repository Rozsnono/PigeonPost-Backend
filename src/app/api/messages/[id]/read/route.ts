import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

import Pigeon from '@/models/Pigeon';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// PATCH /api/messages/[id]/read — mark message as read and trigger 2x speed return flight (or hold)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  const { id } = await params;

  try {
    await connectToDatabase();
    const message = await Message.findById(id);
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404, headers: CORS_HEADERS });
    if (message.recipientId.toString() !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: CORS_HEADERS });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is allowed
    }

    const now = new Date();

    if (!message.isRead) {
      message.isRead = true;
      message.status = 'delivered';
      await User.findByIdAndUpdate(auth.userId, { $inc: { 'stats.receivedCount': 1 } });
    }

    const action = body?.action; // 'feed' | 'cage' | 'release'

    if (action === 'feed') {
      // Feed seeds: costs 5 seeds, holds pigeon for 30 minutes
      const user = await User.findById(auth.userId);
      if (user && user.inventory?.seeds >= 5) {
        user.inventory.seeds -= 5;
        await user.save();
        message.heldByAction = 'fed_seeds';
        message.returningStatus = 'held_by_recipient';
        message.heldUntil = new Date(now.getTime() + 30 * 60000);
      }
    } else if (action === 'cage') {
      // Put in cage: costs 1 cage
      const user = await User.findById(auth.userId);
      if (user && user.inventory?.cages >= 1) {
        user.inventory.cages -= 1;
        await user.save();
        message.heldByAction = 'caged';
        message.returningStatus = 'held_by_recipient';
      }
    } else {
      // Normal: Pigeon flies back to sender at 2X SPEED!
      const returnDurationMinutes = Math.max(1, Math.round(message.flightDurationMinutes / 2));
      message.returningStatus = 'returning';
      message.returnDispatchedAt = now;
      message.returnEstimatedArrivalAt = new Date(now.getTime() + returnDurationMinutes * 60000);

      // Update pigeon status to returning (handles both single birds and flocks)
      if (message.pigeonIds && message.pigeonIds.length > 0) {
        await Pigeon.updateMany({ _id: { $in: message.pigeonIds } }, { status: 'returning' });
      } else if (message.pigeonId) {
        await Pigeon.findByIdAndUpdate(message.pigeonId, { status: 'returning' });
      }
    }

    await message.save();

    return NextResponse.json({
      message: 'Marked as read',
      returningStatus: message.returningStatus,
      returnEstimatedArrivalAt: message.returnEstimatedArrivalAt,
    }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('PATCH /api/messages/[id]/read error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
