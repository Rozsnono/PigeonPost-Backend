import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Pigeon from '@/models/Pigeon';

export async function GET(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Get all flying pigeons with owner info
    const flights = await Pigeon.find({ status: 'flying' })
      .populate('ownerId', 'username email')
      .sort({ updatedAt: -1 })
      .lean();
    
    return NextResponse.json(flights);
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
