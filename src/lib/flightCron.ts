import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import Pigeon from '@/models/Pigeon';
import User from '@/models/User';
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
      .populate('senderId', 'username location expoPushToken')
      .populate('recipientId', 'username expoPushToken')
      .populate('pigeonId', 'name identifier species')
      .lean();

    for (const m of arrivingMessages) {
      await Message.findByIdAndUpdate(m._id, {
        status: 'delivered',
        deliveredNotified: true,
        senderDeliveredNotified: true,
      });

      deliveredCount++;

      if (m.recipientId && typeof m.recipientId === 'object' && (m.recipientId as any).expoPushToken) {
        const recipient = m.recipientId as any;
        const sender = m.senderId as any;
        const senderName = sender?.username || 'Egy ismerősöd';
        const originCity = sender?.location?.city || 'Ismeretlen város';
        const birdText = m.isFlock ? `Egy ${m.flockSize || 1} madárból álló raj` : 'Egy futárgalamb';

        await sendPushToUser(
          recipient,
          '📬 Új galamb landolt a dúcban!',
          `${senderName} levelet küldött neked (${originCity} felől). ${birdText} érkezett meg!`,
          { type: 'letter_delivered', messageId: m._id }
        ).catch((err) => {
          console.warn('[checkFlightStatuses] Push to recipient failed:', err);
        });
      }

      if (m.senderId && typeof m.senderId === 'object' && (m.senderId as any).expoPushToken) {
        const sender = m.senderId as any;
        const recipient = m.recipientId as any;
        const recipientName = recipient?.username || 'Címzett';
        const title = m.isFlock ? '🦅 A madárraj célba ért!' : '🕊️ A galambod odaért!';
        const body = m.isFlock
          ? `A ${m.flockSize || 1} madárból álló raj sikeresen átadta a levelet ${recipientName} dúcában!`
          : `${(m.pigeonId as any)?.name || 'A galambod'} sikeresen odaért a levéllel ${recipientName} dúcába!`;

        await sendPushToUser(
          sender,
          title,
          body,
          { type: 'letter_delivered_sender', messageId: m._id }
        ).catch((err) => {
          console.warn('[checkFlightStatuses] Push to sender failed:', err);
        });
      }
    }

    // Auto-dispatch returning flight for pigeons delivered > 30s ago with returningStatus === 'idle'
    const thirtySecAgo = new Date(now.getTime() - 30 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000);

    await Message.updateMany(
      {
        status: 'delivered',
        returningStatus: 'idle',
        estimatedArrivalAt: { $lte: twoHoursAgo },
      },
      { returningStatus: 'returned' }
    );

    const pendingReturnMessages = await Message.find({
      status: 'delivered',
      returningStatus: 'idle',
      estimatedArrivalAt: { $lte: thirtySecAgo, $gt: twoHoursAgo },
    }).lean();

    for (const m of pendingReturnMessages) {
      const returnDurationMinutes = Math.max(1, Math.round((m.flightDurationMinutes || 10) / 2));
      const returnDispatchedAt = now;
      const returnEstimatedArrivalAt = new Date(now.getTime() + returnDurationMinutes * 60000);

      await Message.findByIdAndUpdate(m._id, {
        returningStatus: 'returning',
        returnDispatchedAt,
        returnEstimatedArrivalAt,
      });

      if (m.pigeonIds && m.pigeonIds.length > 0) {
        await Pigeon.updateMany({ _id: { $in: m.pigeonIds } }, { status: 'returning' });
      } else if (m.pigeonId) {
        await Pigeon.findByIdAndUpdate(m.pigeonId, { status: 'returning' });
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

      const userXpEarned = Math.max(15, Math.round(15 + (m.distanceKm || 1) * 0.4));
      const pigeonXpEarned = Math.max(20, Math.round(20 + (m.distanceKm || 1) * 0.5));

      const pids = m.pigeonIds && m.pigeonIds.length > 0
        ? m.pigeonIds.map((p: any) => p._id || p)
        : [(m.pigeonId as any)?._id || m.pigeonId].filter(Boolean);

      for (const pid of pids) {
        const pig = await Pigeon.findById(pid);
        if (pig) {
          pig.status = 'idle';
          let pLvl = pig.level || 1;
          let pXp = (pig.xp || 0) + pigeonXpEarned;
          while (pXp >= pLvl * 100) {
            pXp -= pLvl * 100;
            pLvl += 1;
            pig.speedKmH = (pig.speedKmH || 80) + 2;
          }
          pig.level = pLvl;
          pig.xp = pXp;
          await pig.save();
        }
      }

      // Credit delivery gold reward & XP to sender
      const goldReward = m.deliveryGoldReward || Math.max(5, Math.round(5 + (m.distanceKm || 1) / 15));
      const senderUserId = (m.senderId as any)?._id || m.senderId;
      if (senderUserId) {
        const sUser = await User.findById(senderUserId);
        if (sUser) {
          sUser.gold = (sUser.gold ?? 0) + goldReward;
          let uLvl = sUser.level || 1;
          let uXp = (sUser.xp || 0) + userXpEarned;
          while (uXp >= uLvl * 100) {
            uXp -= uLvl * 100;
            uLvl += 1;
            sUser.gold += uLvl * 25;
          }
          sUser.level = uLvl;
          sUser.xp = uXp;
          await sUser.save();
        }
      }

      returnedCount++;

      if (m.senderId && typeof m.senderId === 'object' && (m.senderId as any).expoPushToken) {
        const sender = m.senderId as any;
        const pigeon = m.pigeonId as any;
        const pigeonName = m.isFlock 
          ? `A(z) ${m.flockSize || 1} tagú madárrajod` 
          : (pigeon?.name || 'Postagalambod');

        await sendPushToUser(
          sender,
          '🕊️ A galambod hazaért!',
          `${pigeonName} sikeresen visszatért a dúcba, és +${goldReward} aranyat és +${userXpEarned} XP-t hozott a kézbesítésért!`,
          { type: 'pigeon_returned', messageId: m._id, goldEarned: goldReward, xpEarned: userXpEarned }
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
