import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import Pigeon from '@/models/Pigeon';
import { sendPushToUser } from '@/lib/push';
import { createLog } from '@/lib/logger';

// GET /api/cron/check-flights — checks for arriving letters and returning pigeons, updates DB & triggers push
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const now = new Date();

    let deliveredCount = 0;
    let returnedCount = 0;

    // 1. Check for incoming delivered letters that have not triggered push yet
    const arrivingMessages = await Message.find({
      status: 'flying',
      estimatedArrivalAt: { $lte: now },
    })
      .populate('senderId', 'username location')
      .populate('recipientId', 'username expoPushToken')
      .lean();

    for (const m of arrivingMessages) {
      await Message.findByIdAndUpdate(m._id, {
        status: 'delivered',
        deliveredNotified: true,
      });

      deliveredCount++;

      if (m.recipientId?.expoPushToken) {
        const senderName = m.senderId?.username || 'Egy ismerősöd';
        const originCity = m.senderId?.location?.city || 'Ismeretlen dúc';

        await sendPushToUser(
          m.recipientId,
          '📬 Új galamb landolt a dúcban!',
          `${senderName} levelet küldött neked (${originCity} felől). Nyisd meg a postaládádat!`,
          { type: 'letter_delivered', messageId: m._id }
        );
      }
    }

    // 2. Check for returning pigeons that arrived back at sender's loft
    const returningMessages = await Message.find({
      returningStatus: 'returning',
      returnEstimatedArrivalAt: { $lte: now },
    })
      .populate('senderId', 'username expoPushToken')
      .populate('pigeonId', 'name identifier status')
      .lean();

    for (const m of returningMessages) {
      await Message.findByIdAndUpdate(m._id, {
        returningStatus: 'returned',
        returnedNotified: true,
      });

      if (m.pigeonId?._id || m.pigeonId) {
        const pid = m.pigeonId?._id || m.pigeonId;
        await Pigeon.findByIdAndUpdate(pid, { status: 'idle' });
      }

      returnedCount++;

      if (m.senderId?.expoPushToken) {
        const pigeonName = m.pigeonId?.name || 'Postagalambod';

        await sendPushToUser(
          m.senderId,
          '🕊️ A galambod hazaért!',
          `${pigeonName} sikeresen visszatért a dúcba a kézbesítés után!`,
          { type: 'pigeon_returned', messageId: m._id }
        );
      }
    }

    if (deliveredCount > 0 || returnedCount > 0) {
      await createLog(
        'info',
        'FlightCron',
        `Cron repülés ellenőrzés: ${deliveredCount} levél kézbesítve, ${returnedCount} galamb hazaérkezett`,
        { deliveredCount, returnedCount }
      );
    }

    return NextResponse.json({
      success: true,
      deliveredCount,
      returnedCount,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('GET /api/cron/check-flights error:', error);
    return NextResponse.json({ error: error?.message || 'Server Error' }, { status: 500 });
  }
}
