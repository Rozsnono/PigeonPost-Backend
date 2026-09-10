import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

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
      .populate('senderId', 'username avatar')
      .populate('recipientId', 'username avatar')
      .lean();

    const now = new Date();

    const messages = messagesRaw.map((m: any) => {
      const isRecipient = m.recipientId?._id?.toString() === auth.userId;
      const isSender = m.senderId?._id?.toString() === auth.userId;

      // Auto-arrive returning pigeons
      if (m.returningStatus === 'returning' && m.returnEstimatedArrivalAt && new Date(m.returnEstimatedArrivalAt) <= now) {
        m.returningStatus = 'returned';
        Message.findByIdAndUpdate(m._id, { returningStatus: 'returned' }).exec();
        if (m.pigeonId) {
          Pigeon.findByIdAndUpdate(m.pigeonId, { status: 'idle' }).exec();
        }
      }

      // Auto-arrive delivered messages if time reached
      if (m.status === 'flying' && new Date(m.estimatedArrivalAt) <= now) {
        m.status = 'delivered';
        Message.findByIdAndUpdate(m._id, { status: 'delivered' }).exec();
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
