import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';

export async function GET(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get recent active flights (flying messages)
    const activeMessages = await Message.find({ status: 'flying' })
      .populate('senderId', 'username')
      .populate('recipientId', 'username')
      .sort({ dispatchedAt: -1 })
      .limit(50)
      .lean();

    const totalMessages = await Message.countDocuments();
    const flyingMessages = await Message.countDocuments({ status: 'flying' });
    const deliveredMessages = await Message.countDocuments({ status: 'delivered' });
    const lostMessages = await Message.countDocuments({ status: 'expired_lost' });

    return NextResponse.json({
      stats: { totalMessages, flyingMessages, deliveredMessages, lostMessages },
      activeMessages,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
