import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import Pigeon from '@/models/Pigeon';
import { createLog } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);
    const messageId = body.messageId || searchParams.get('id');

    if (!messageId) {
      return NextResponse.json({ error: 'Üzenet azonosító hiányzik' }, { status: 400 });
    }

    await connectToDatabase();

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Az üzenet nem található' }, { status: 404 });
    }

    message.status = 'delivered';
    message.estimatedArrivalAt = new Date();
    await message.save();

    // Ha van hozzárendelt galamb, azt is tehermentesítjük
    if (message.pigeonId) {
      await Pigeon.findByIdAndUpdate(message.pigeonId, {
        status: 'idle',
        fatigue: 0,
      });
    }

    await createLog(
      'info',
      'Admin',
      `Repülés azonnal kézbesítve az admin által (Üzenet: ${messageId})`,
      { messageId, pigeonId: message.pigeonId }
    );

    return NextResponse.json({
      success: true,
      message: 'A repülés azonnal lezárult, a levél kézbesítve lett.',
    });
  } catch (error: any) {
    console.error('POST /api/admin/messages/deliver error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
