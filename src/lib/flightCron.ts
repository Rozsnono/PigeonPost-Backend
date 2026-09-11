import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import Pigeon from '@/models/Pigeon';
import { sendPushToUser } from '@/lib/push';
import { createLog } from '@/lib/logger';

let isRunning = false;

/**
 * Checks for arriving letters and returning pigeons, updates DB & triggers Expo push notifications.
 * Works even when the recipient's or sender's mobile app is closed or in background!
 */
export async function checkFlightStatuses() {
  if (isRunning) {
    return { skipped: true, reason: 'Already running' };
  }

  isRunning = true;
  try {
    await connectToDatabase();
    const now = new Date();

    let deliveredCount = 0;
    let returnedCount = 0;

    // 1. Arriving in-flight letters (flying -> delivered)
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

      if (m.recipientId && typeof m.recipientId === 'object' && (m.recipientId as any).expoPushToken) {
        const recipient = m.recipientId as any;
        const sender = m.senderId as any;
        const senderName = sender?.username || 'Egy ismerősöd';
        const originCity = sender?.location?.city || 'Ismeretlen város';

        await sendPushToUser(
          recipient,
          '📬 Új galamb landolt a dúcban!',
          `${senderName} levelet küldött neked (${originCity} felől). Nyisd meg a postaládádat!`,
          { type: 'letter_delivered', messageId: m._id }
        ).catch((err) => {
          console.warn('[checkFlightStatuses] Push to recipient failed:', err);
        });
      }
    }

    // 2. Returning pigeons that arrived back home at sender's loft (returning -> returned, pigeon status -> idle)
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

      const pid = (m.pigeonId as any)?._id || m.pigeonId;
      if (pid) {
        await Pigeon.findByIdAndUpdate(pid, { status: 'idle' });
      }

      returnedCount++;

      if (m.senderId && typeof m.senderId === 'object' && (m.senderId as any).expoPushToken) {
        const sender = m.senderId as any;
        const pigeon = m.pigeonId as any;
        const pigeonName = pigeon?.name || 'Postagalambod';

        await sendPushToUser(
          sender,
          '🕊️ A galambod hazaért!',
          `${pigeonName} sikeresen visszatért a dúcba a kézbesítés után!`,
          { type: 'pigeon_returned', messageId: m._id }
        ).catch((err) => {
          console.warn('[checkFlightStatuses] Push to sender failed:', err);
        });
      }
    }

    if (deliveredCount > 0 || returnedCount > 0) {
      await createLog(
        'info',
        'FlightCron',
        `Repülés ellenőrzés: ${deliveredCount} levél kézbesítve, ${returnedCount} galamb hazaérkezett`,
        { deliveredCount, returnedCount }
      );
    }

    return {
      success: true,
      deliveredCount,
      returnedCount,
      timestamp: now.toISOString(),
    };
  } catch (error: any) {
    console.error('[checkFlightStatuses] Error:', error);
    return { error: error?.message || 'Flight check error' };
  } finally {
    isRunning = false;
  }
}
