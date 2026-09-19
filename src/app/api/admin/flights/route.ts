import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Pigeon from '@/models/Pigeon';
import Message from '@/models/Message';
import Expedition from '@/models/Expedition';
import { createLog } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Get all flying pigeons with owner info
    const flights = await Pigeon.find({ status: { $in: ['flying', 'returning'] } })
      .populate('ownerId', 'username email')
      .sort({ updatedAt: -1 })
      .lean();
    
    return NextResponse.json(flights);
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const now = new Date();

    // 1. Deliver all in-flight messages immediately
    const messagesResult = await Message.updateMany(
      { status: { $in: ['flying', 'sent'] } },
      {
        $set: {
          status: 'delivered',
          estimatedArrivalAt: now,
        },
      }
    );

    // 2. Fast-forward all active expeditions so they arrive home immediately
    const expeditionsResult = await Expedition.updateMany(
      { status: 'exploring' },
      {
        $set: {
          estimatedReturnAt: new Date(now.getTime() - 1000),
        },
      }
    );

    // 3. Reset all flying/returning pigeons to idle
    const pigeonsResult = await Pigeon.updateMany(
      { status: { $in: ['flying', 'returning'] } },
      {
        $set: {
          status: 'idle',
        },
      }
    );

    await createLog(
      'warn',
      'Admin',
      `⚡ Összes repülés és expedíció azonnal felgyorsítva az admin által! (${messagesResult.modifiedCount} levél, ${expeditionsResult.modifiedCount} expedíció, ${pigeonsResult.modifiedCount} madár)`,
      {
        messagesCount: messagesResult.modifiedCount,
        expeditionsCount: expeditionsResult.modifiedCount,
        pigeonsCount: pigeonsResult.modifiedCount,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Sikeres gyorsítás! ${messagesResult.modifiedCount} levél kézbesítve, ${expeditionsResult.modifiedCount} expedíció megérkezett, ${pigeonsResult.modifiedCount} madár hazatért a dúcba.`,
      stats: {
        messagesDelivered: messagesResult.modifiedCount,
        expeditionsAccelerated: expeditionsResult.modifiedCount,
        pigeonsReturned: pigeonsResult.modifiedCount,
      },
    });
  } catch (error: any) {
    console.error('POST /api/admin/flights accelerate error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
