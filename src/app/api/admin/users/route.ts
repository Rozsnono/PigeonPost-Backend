import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { createLog } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const users = await User.find({ isDeleted: false }).select('-passwordHash').sort({ createdAt: -1 }).lean();
    
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

// Delete user (supports soft delete and permanent delete)
export async function DELETE(req: NextRequest) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) return NextResponse.json({ error: 'User ID missing' }, { status: 400 });

    await connectToDatabase();
    
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'Felhasználó nem található' }, { status: 404 });

    const permanent = searchParams.get('permanent') === 'true';
    if (permanent) {
      await User.findByIdAndDelete(userId);
      await createLog('warn', 'Admin', `Felhasználó véglegesen törölve: ${user.username} (${user.email})`, { userId });
    } else {
      user.isDeleted = true;
      user.deletedAt = new Date();
      await user.save();
      await createLog('warn', 'Admin', `Felhasználó archiválva/törölve: ${user.username} (${user.email})`, { userId });
    }

    return NextResponse.json({ success: true, message: `${user.username} sikeresen törölve.` });
  } catch (error) {
    console.error('DELETE /api/admin/users error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
