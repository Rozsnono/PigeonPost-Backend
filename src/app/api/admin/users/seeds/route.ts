import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { parseAdminAmount } from '@/lib/adminAmount';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, amount } = await req.json();

    const numAmount = parseAdminAmount(amount);
    if (!userId || numAmount === null) {
      return NextResponse.json({ error: 'Hiányzó vagy érvénytelen paraméter (az összeg 0-tól különböző egész szám, legfeljebb ±10 000 000)' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Régi/hiányos dokumentumnál az `inventory` lehet null: ilyenkor a $inc hibát dobna
    await User.updateOne({ _id: userId, inventory: null }, { $set: { inventory: { seeds: 0, cages: 0 } } });
    const updated = await User.findByIdAndUpdate(userId, { $inc: { 'inventory.seeds': numAmount } }, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, newSeeds: updated.inventory?.seeds });
  } catch (error) {
    console.error('POST /api/admin/users/seeds error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
