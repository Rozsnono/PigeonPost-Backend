import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import WheelSlot from '@/models/WheelSlot';
import { createLog } from '@/lib/logger';

export const DEFAULT_WHEEL_SLOTS = [
  { slotId: 'gold_25', label: '25 Arany', type: 'gold', amount: 25, weight: 35, rarity: 'common', color: '#f59e0b', order: 0, isActive: true },
  { slotId: 'gold_50', label: '50 Arany', type: 'gold', amount: 50, weight: 25, rarity: 'uncommon', color: '#10b981', order: 1, isActive: true },
  { slotId: 'seeds_20', label: '20 Madármag', type: 'seeds', amount: 20, weight: 18, rarity: 'uncommon', color: '#34d399', order: 2, isActive: true },
  { slotId: 'xp_50', label: '50 XP Bónusz', type: 'xp', amount: 50, weight: 12, rarity: 'rare', color: '#818cf8', order: 3, isActive: true },
  { slotId: 'gold_150', label: '150 Arany', type: 'gold', amount: 150, weight: 6, rarity: 'epic', color: '#a855f7', order: 4, isActive: true },
  { slotId: 'cage_1', label: '1 Új Kalitka', type: 'cages', amount: 1, weight: 2.5, rarity: 'legendary', color: '#ec4899', order: 5, isActive: true },
  { slotId: 'gold_500', label: '500 Arany Jackpot!', type: 'gold', amount: 500, weight: 1.2, rarity: 'legendary', color: '#f43f5e', order: 6, isActive: true },
  { slotId: 'gold_1000', label: '1000 Arany Kincs!', type: 'gold', amount: 1000, weight: 0.3, rarity: 'mythic', color: '#fbbf24', order: 7, isActive: true },
];

export async function GET(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    let slots = await WheelSlot.find().sort({ order: 1, createdAt: 1 }).lean();

    if (!slots || slots.length === 0) {
      await WheelSlot.insertMany(DEFAULT_WHEEL_SLOTS);
      slots = await WheelSlot.find().sort({ order: 1, createdAt: 1 }).lean();
    }

    const totalWeight = slots.filter((s: any) => s.isActive !== false).reduce((acc: number, s: any) => acc + (s.weight || 1), 0);

    const enrichedSlots = slots.map((s: any) => ({
      ...s,
      chancePercent: totalWeight > 0 ? Number(((s.weight / totalWeight) * 100).toFixed(1)) : 0,
    }));

    return NextResponse.json({ slots: enrichedSlots, totalWeight });
  } catch (error: any) {
    console.error('GET /api/admin/wheel error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { _id, slotId, label, type, amount, weight, color, rarity, isActive, order } = body;

    if (!label || amount === undefined || weight === undefined) {
      return NextResponse.json({ error: 'Minden kötelező mezőt tölts ki (label, amount, weight)' }, { status: 400 });
    }

    await connectToDatabase();

    let slot;
    if (_id) {
      slot = await WheelSlot.findById(_id);
    } else if (slotId) {
      slot = await WheelSlot.findOne({ slotId });
    }

    if (slot) {
      slot.label = label.trim();
      slot.type = type || slot.type;
      slot.amount = Math.max(0, Number(amount));
      slot.weight = Math.max(0.01, Number(weight));
      if (color) slot.color = color;
      if (rarity) slot.rarity = rarity;
      if (isActive !== undefined) slot.isActive = Boolean(isActive);
      if (order !== undefined) slot.order = Number(order);
      await slot.save();

      await createLog('info', 'Admin', `Pörgetőskerék szelet módosítva: ${slot.label} (${slot.weight} súly, ${slot.amount} ${slot.type})`);
      return NextResponse.json({ success: true, message: `"${slot.label}" sikeresen frissítve!`, slot });
    } else {
      const newSlotId = slotId?.trim() || `slot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const maxOrderSlot = await WheelSlot.findOne().sort({ order: -1 });
      const nextOrder = order !== undefined ? Number(order) : (maxOrderSlot?.order ?? 0) + 1;

      const created = await WheelSlot.create({
        slotId: newSlotId,
        label: label.trim(),
        type: type || 'gold',
        amount: Math.max(0, Number(amount)),
        weight: Math.max(0.01, Number(weight)),
        color: color || '#f59e0b',
        rarity: rarity || 'common',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        order: nextOrder,
      });

      await createLog('info', 'Admin', `Új pörgetőskerék szelet hozzáadva: ${created.label} (${created.weight} súly, ${created.amount} ${created.type})`);
      return NextResponse.json({ success: true, message: `"${created.label}" sikeresen létrehozva!`, slot: created });
    }
  } catch (error: any) {
    console.error('POST /api/admin/wheel error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Slot ID hiányzik' }, { status: 400 });
    }

    await connectToDatabase();

    const slot = await WheelSlot.findById(id);
    if (!slot) {
      return NextResponse.json({ error: 'Szelet nem található' }, { status: 404 });
    }

    await WheelSlot.findByIdAndDelete(id);
    await createLog('warn', 'Admin', `Pörgetőskerék szelet törölve: ${slot.label}`);

    return NextResponse.json({ success: true, message: `"${slot.label}" törölve lett.` });
  } catch (error: any) {
    console.error('DELETE /api/admin/wheel error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Reset to default wheel slots
    await WheelSlot.deleteMany({});
    await WheelSlot.insertMany(DEFAULT_WHEEL_SLOTS);
    await createLog('warn', 'Admin', 'Pörgetőskerék visszaállítva az alapértelmezett nyereményekre és esélyekre');

    const slots = await WheelSlot.find().sort({ order: 1 });
    return NextResponse.json({ success: true, message: 'Pörgetőskerék alaphelyzetbe állítva!', slots });
  } catch (error: any) {
    console.error('PUT /api/admin/wheel error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
