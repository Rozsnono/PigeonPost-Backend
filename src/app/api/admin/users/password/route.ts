import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { createLog } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'Hiányzó paraméterek (userId, newPassword)' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'A jelszónak legalább 6 karakter hosszúnak kell lennie!' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'A felhasználó nem található' }, { status: 404 });
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    user.passwordHash = newPasswordHash;
    await user.save();

    await createLog('warn', 'Admin', `Admin jelszó-visszaállítás a következő felhasználónak: ${user.username} (${user.email})`, { userId });

    return NextResponse.json({ success: true, message: `${user.username} jelszava sikeresen frissítve.` });
  } catch (error) {
    console.error('POST /api/admin/users/password error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
