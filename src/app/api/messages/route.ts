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
      .populate('pigeonId', 'name identifier status')
      .lean();

    const now = new Date();

    const messages = messagesRaw.map((m: any) => {
      const isRecipient = m.recipientId?._id?.toString() === auth.userId;
      const isSender = m.senderId?._id?.toString() === auth.userId;

      // Auto-arrive returning pigeons
      if (m.returningStatus === 'returning' && m.returnEstimatedArrivalAt && new Date(m.returnEstimatedArrivalAt) <= now) {
        m.returningStatus = 'returned';
        Message.findByIdAndUpdate(m._id, { returningStatus: 'returned', returnedNotified: true }).exec();
        if (m.pigeonId?._id || m.pigeonId) {
          const pid = m.pigeonId?._id || m.pigeonId;
          Pigeon.findByIdAndUpdate(pid, { status: 'idle' }).exec();
        }

        // Push notification to sender that their pigeon returned home!
        if (!m.returnedNotified && m.senderId?.expoPushToken) {
          const pigeonName = m.pigeonId?.name || 'Postagalambod';
          sendPushToUser(
            m.senderId,
            '🕊️ A galambod hazaért!',
            `${pigeonName} sikeresen visszatért a dúcba a kézbesítés után!`,
            { type: 'pigeon_returned', messageId: m._id }
          ).catch(() => {});
        }
      }

      // Auto-arrive delivered messages if time reached
      if (m.status === 'flying' && new Date(m.estimatedArrivalAt) <= now) {
        m.status = 'delivered';
        Message.findByIdAndUpdate(m._id, { status: 'delivered', deliveredNotified: true }).exec();

        // Push notification to recipient that a new letter has arrived in their loft!
        if (!m.deliveredNotified && m.recipientId?.expoPushToken) {
          const senderName = m.senderId?.username || 'Egy ismerősöd';
          const originCity = m.senderId?.location?.city || 'Ismeretlen dúc';
          sendPushToUser(
            m.recipientId,
            '📬 Új galamb landolt a dúcban!',
            `${senderName} levelet küldött neked (${originCity} felől). Nyisd meg a postaládádat!`,
            { type: 'letter_delivered', messageId: m._id }
          ).catch(() => {});
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
