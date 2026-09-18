import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Pigeon from '@/models/Pigeon';
import { createLog } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const ownerId = searchParams.get('ownerId');

    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (ownerId) {
      filter.ownerId = ownerId;
    }

    const pigeons = await Pigeon.find(filter)
      .populate('ownerId', 'username email avatar level gold')
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(pigeons);
  } catch (error: any) {
    console.error('GET /api/admin/pigeons error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { pigeonId, name, level, xp, speedKmH, fatigue, status, species, journeysCount } = body;

    if (!pigeonId) {
      return NextResponse.json({ error: 'Galamb azonosító (pigeonId) megadása kötelező' }, { status: 400 });
    }

    await connectToDatabase();

    const pigeon = await Pigeon.findById(pigeonId);
    if (!pigeon) {
      return NextResponse.json({ error: 'A galamb nem található' }, { status: 404 });
    }

    const changes: string[] = [];

    if (name !== undefined && name !== pigeon.name) {
      changes.push(`Név: ${pigeon.name} -> ${name}`);
      pigeon.name = name.trim();
    }
    if (level !== undefined && !isNaN(Number(level))) {
      const lvlNum = Math.max(1, Math.floor(Number(level)));
      if (lvlNum !== pigeon.level) {
        changes.push(`Szint: ${pigeon.level} -> ${lvlNum}`);
        pigeon.level = lvlNum;
      }
    }
    if (xp !== undefined && !isNaN(Number(xp))) {
      const xpNum = Math.max(0, Math.floor(Number(xp)));
      if (xpNum !== pigeon.xp) {
        changes.push(`XP: ${pigeon.xp} -> ${xpNum}`);
        pigeon.xp = xpNum;
      }
    }
    if (speedKmH !== undefined && !isNaN(Number(speedKmH))) {
      const spd = Math.max(10, Math.floor(Number(speedKmH)));
      if (spd !== pigeon.speedKmH) {
        changes.push(`Sebesség: ${pigeon.speedKmH} -> ${spd} km/h`);
        pigeon.speedKmH = spd;
      }
    }
    if (fatigue !== undefined && !isNaN(Number(fatigue))) {
      const fat = Math.min(100, Math.max(0, Math.floor(Number(fatigue))));
      if (fat !== pigeon.fatigue) {
        changes.push(`Fáradtság: ${pigeon.fatigue}% -> ${fat}%`);
        pigeon.fatigue = fat;
      }
    }
    if (status !== undefined && ['idle', 'flying', 'returning', 'resting', 'dead'].includes(status)) {
      if (status !== pigeon.status) {
        changes.push(`Állapot: ${pigeon.status} -> ${status}`);
        pigeon.status = status;
        if (status === 'idle') {
          pigeon.cooldownUntil = null;
        }
      }
    }
    if (species !== undefined && typeof species === 'string' && species.trim()) {
      if (species !== pigeon.species) {
        changes.push(`Faj: ${pigeon.species} -> ${species}`);
        pigeon.species = species.trim();
      }
    }
    if (journeysCount !== undefined && !isNaN(Number(journeysCount))) {
      pigeon.journeysCount = Math.max(0, Math.floor(Number(journeysCount)));
    }

    await pigeon.save();

    await createLog(
      'info',
      'Admin',
      `Galamb adatai módosítva: ${pigeon.name} (${pigeon.identifier}). Módosítások: ${changes.join(', ') || 'Nincs változás'}`,
      { pigeonId, ownerId: pigeon.ownerId, changes }
    );

    return NextResponse.json({
      success: true,
      message: `"${pigeon.name}" adatai sikeresen elmentve!`,
      pigeon,
    });
  } catch (error: any) {
    console.error('PATCH /api/admin/pigeons error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pigeonId = searchParams.get('id');

    if (!pigeonId) {
      return NextResponse.json({ error: 'Galamb azonosító hiányzik' }, { status: 400 });
    }

    await connectToDatabase();

    const pigeon = await Pigeon.findById(pigeonId);
    if (!pigeon) {
      return NextResponse.json({ error: 'A galamb nem található' }, { status: 404 });
    }

    await Pigeon.findByIdAndDelete(pigeonId);

    await createLog('warn', 'Admin', `Galamb törölve: ${pigeon.name} (${pigeon.identifier})`, {
      pigeonId,
      ownerId: pigeon.ownerId,
    });

    return NextResponse.json({
      success: true,
      message: `"${pigeon.name}" galamb sikeresen törölve.`,
    });
  } catch (error: any) {
    console.error('DELETE /api/admin/pigeons error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
