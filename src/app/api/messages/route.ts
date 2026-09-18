import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';
import { sendPushToUser } from '@/lib/push';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/messages?type=inbox|sent|all
export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  const type = req.nextUrl.searchParams.get('type') || 'inbox';

  try {
    await connectToDatabase();

    let query: any = {};
    if (type === 'inbox') {
      query = { recipientId: auth.userId };
    } else if (type === 'sent') {
      query = { senderId: auth.userId };
    } else {
      query = { $or: [{ senderId: auth.userId }, { recipientId: auth.userId }] };
    }

    const messagesRaw = await Message.find(query)
      .sort({ createdAt: -1 })
      .populate('senderId', 'username avatar location expoPushToken')
      .populate('recipientId', 'username avatar location expoPushToken')
      .populate('pigeonId', 'name identifier species status level speedKmH')
      .populate('pigeonIds', 'name identifier species status level speedKmH')
      .lean();

    const now = new Date();

    const messages = messagesRaw.map((m: any) => {
      const isRecipient = m.recipientId?._id?.toString() === auth.userId;
      const isSender = m.senderId?._id?.toString() === auth.userId;

      // Auto-arrive returning pigeons
      if (m.returningStatus === 'returning' && m.returnEstimatedArrivalAt && new Date(m.returnEstimatedArrivalAt) <= now) {
        m.returningStatus = 'returned';
        Message.findByIdAndUpdate(m._id, { returningStatus: 'returned', returnedNotified: true }).exec();
        
        if (m.pigeonIds && m.pigeonIds.length > 0) {
          const pids = m.pigeonIds.map((p: any) => p._id || p);
          Pigeon.updateMany({ _id: { $in: pids } }, { status: 'idle' }).exec();
        } else if (m.pigeonId?._id || m.pigeonId) {
          const pid = m.pigeonId?._id || m.pigeonId;
          Pigeon.findByIdAndUpdate(pid, { status: 'idle' }).exec();
        }

        // Credit delivery gold reward & XP to sender
        const goldReward = m.deliveryGoldReward || Math.max(5, Math.round(5 + (m.distanceKm || 1) / 15));
        const senderUserId = m.senderId?._id || m.senderId;
        const userXpEarned = Math.max(15, Math.round(15 + (m.distanceKm || 1) * 0.4));
        const pigeonXpEarned = Math.max(20, Math.round(20 + (m.distanceKm || 1) * 0.5));

        if (senderUserId) {
          User.findById(senderUserId).then(async (sUser) => {
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
          }).catch(() => {});
        }

        const pids = m.pigeonIds && m.pigeonIds.length > 0
          ? m.pigeonIds.map((p: any) => p._id || p)
          : (m.pigeonId?._id || m.pigeonId ? [m.pigeonId?._id || m.pigeonId] : []);

        for (const pid of pids) {
          Pigeon.findById(pid).then(async (pig) => {
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
          }).catch(() => {});
        }

        // Push notification to sender that their pigeon returned home!
        if (!m.returnedNotified && m.senderId?.expoPushToken) {
          const pigeonName = m.isFlock 
            ? `A(z) ${m.flockSize || 1} tagú madárrajod` 
            : (m.pigeonId?.name || 'Postagalambod');
          sendPushToUser(
            m.senderId,
            '🕊️ A galambod hazaért!',
            `${pigeonName} sikeresen visszatért a dúcba, és +${goldReward} aranyat és +${userXpEarned} XP-t hozott a kézbesítésért!`,
            { type: 'pigeon_returned', messageId: m._id, goldEarned: goldReward, xpEarned: userXpEarned }
          ).catch(() => {});
        }
      }

      // Auto-arrive delivered messages if time reached
      if (m.status === 'flying' && new Date(m.estimatedArrivalAt) <= now) {
        m.status = 'delivered';
        Message.findByIdAndUpdate(m._id, { status: 'delivered', deliveredNotified: true, senderDeliveredNotified: true }).exec();

        // Push notification to recipient that a new letter has arrived in their loft!
        if (!m.deliveredNotified && m.recipientId?.expoPushToken) {
          const senderName = m.senderId?.username || 'Egy ismerősöd';
          const originCity = m.senderId?.location?.city || 'Ismeretlen dúc';
          const birdText = m.isFlock ? `Egy ${m.flockSize || 1} madárból álló raj` : 'Egy futárgalamb';
          sendPushToUser(
            m.recipientId,
            '📬 Új galamb landolt a dúcban!',
            `${senderName} levelet küldött neked (${originCity} felől). ${birdText} érkezett meg!`,
            { type: 'letter_delivered', messageId: m._id }
          ).catch(() => {});
        }

        // Push notification to sender that their letter was delivered!
        if (!m.senderDeliveredNotified && m.senderId?.expoPushToken) {
          const recipientName = m.recipientId?.username || 'Címzett';
          const title = m.isFlock ? '🦅 A madárraj célba ért!' : '🕊️ A galambod odaért!';
          const body = m.isFlock
            ? `A ${m.flockSize || 1} madárból álló raj sikeresen átadta a levelet ${recipientName} dúcában!`
            : `${m.pigeonId?.name || 'A galambod'} sikeresen odaért a levéllel ${recipientName} dúcába!`;
          sendPushToUser(
            m.senderId,
            title,
            body,
            { type: 'letter_delivered_sender', messageId: m._id }
          ).catch(() => {});
        }
      }

      // Auto-return handling for delivered messages:
      // If delivered for more than 2 hours without return dispatched, settle as returned
      // If delivered for more than 5 minutes without return dispatched, start return flight
      if (m.status === 'delivered' && m.returningStatus === 'idle' && m.estimatedArrivalAt) {
        const arrivalTime = new Date(m.estimatedArrivalAt).getTime();
        const deliveredElapsedMs = now.getTime() - arrivalTime;
        if (deliveredElapsedMs > 2 * 3600 * 1000) {
          m.returningStatus = 'returned';
          Message.findByIdAndUpdate(m._id, { returningStatus: 'returned' }).exec();
          if (m.pigeonIds && m.pigeonIds.length > 0) {
            const pids = m.pigeonIds.map((p: any) => p._id || p);
            Pigeon.updateMany({ _id: { $in: pids } }, { status: 'idle' }).exec();
          } else if (m.pigeonId?._id || m.pigeonId) {
            const pid = m.pigeonId?._id || m.pigeonId;
            Pigeon.findByIdAndUpdate(pid, { status: 'idle' }).exec();
          }
        } else if (deliveredElapsedMs > 30 * 1000) {
          const returnDurationMinutes = Math.max(1, Math.round((m.flightDurationMinutes || 10) / 2));
          m.returningStatus = 'returning';
          m.returnDispatchedAt = now;
          m.returnEstimatedArrivalAt = new Date(now.getTime() + returnDurationMinutes * 60000);

          Message.findByIdAndUpdate(m._id, {
            returningStatus: 'returning',
            returnDispatchedAt: m.returnDispatchedAt,
            returnEstimatedArrivalAt: m.returnEstimatedArrivalAt,
          }).exec();

          if (m.pigeonIds && m.pigeonIds.length > 0) {
            const pids = m.pigeonIds.map((p: any) => p._id || p);
            Pigeon.updateMany({ _id: { $in: pids } }, { status: 'returning' }).exec();
          } else if (m.pigeonId?._id || m.pigeonId) {
            const pid = m.pigeonId?._id || m.pigeonId;
            Pigeon.findByIdAndUpdate(pid, { status: 'returning' }).exec();
          }
        }
      }

      // If incoming message is still flying, HIDE sender identity until delivered/opened
      if (isRecipient && m.status === 'flying') {
        return {
          ...m,
          senderId: {
            _id: m.senderId?._id,
            username: 'Rejtélyes Feladó',
            avatar: 'pigeon-mystery',
          },
          content: 'A levél viaszpecséttel van lezárva...',
        };
      }

      return m;
    });

    return NextResponse.json({ messages }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('GET /api/messages error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
