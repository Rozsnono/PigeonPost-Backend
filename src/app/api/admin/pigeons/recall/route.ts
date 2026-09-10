import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Pigeon from '@/models/Pigeon';
import Message from '@/models/Message';
import { createLog } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);
    const pigeonId = body.pigeonId || searchParams.get('id');

    if (!pigeonId) {
      return NextResponse.json({ error: 'Galamb azonosító hiányzik' }, { status: 400 });
    }

    await connectToDatabase();

    const pigeon = await Pigeon.findById(pigeonId);
    if (!pigeon) {
      return NextResponse.json({ error: 'A galamb nem található' }, { status: 404 });
    }

    // 1. Galamb állapotának és fáradtságának visszaállítása
    pigeon.status = 'idle';
    pigeon.fatigue = 0;
    await pigeon.save();

    // 2. Aktív repülő üzenetek lezárása / kézbesítése
    await Message.updateMany(
      { pigeonId, status: 'flying' },
      { $set: { status: 'delivered', estimatedArrivalAt: new Date() } }
    );

    // 3. Visszatérő üzenetek lezárása
    await Message.updateMany(
      { pigeonId, returningStatus: 'returning' },
      { $set: { returningStatus: 'returned', status: 'returned_to_sender' } }
    );

    await createLog(
      'info',
      'Admin',
      `Galamb azonnal hazajuttatva és kipihentetve: ${pigeon.name} (${pigeon.identifier})`,
      { pigeonId, ownerId: pigeon.ownerId }
    );

    return NextResponse.json({
      success: true,
      message: `${pigeon.name} azonnal hazaért a dúcba, fáradtsága 0%-ra csökkent.`,
    });
  } catch (error: any) {
    console.error('POST /api/admin/pigeons/recall error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
