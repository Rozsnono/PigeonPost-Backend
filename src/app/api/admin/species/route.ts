import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import BirdSpecies from '@/models/BirdSpecies';
import { ensureDefaultSpecies } from '@/app/api/aviary/route';
import { createLog } from '@/lib/logger';

function checkAdminAuth(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${adminSecret}`;
}

// GET /api/admin/species - list all species with stats
export async function GET(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    await ensureDefaultSpecies();

    const speciesList = await BirdSpecies.find({}).sort({ minLevel: 1, priceGold: 1 }).lean();

    // Calculate owner counts for each species
    const speciesWithStats = await Promise.all(
      speciesList.map(async (spec: any) => {
        const ownersCount = await User.countDocuments({ ownedBirds: spec.speciesId });
        const activeCarriersCount = await User.countDocuments({ activeBird: spec.speciesId });
        return {
          ...spec,
          ownersCount,
          activeCarriersCount,
        };
      })
    );

    return NextResponse.json(speciesWithStats);
  } catch (error) {
    console.error('GET /api/admin/species error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

// POST /api/admin/species - create new species
export async function POST(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    const {
      speciesId,
      name,
      subtitle = '',
      speedKmH,
      priceGold = 0,
      minLevel = 1,
      requirementText = '',
      avatarBase64 = '',
      flyingBase64 = '',
      sizeRank = 1,
      isActive = true,
    } = body;

    const cleanId = String(speciesId || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanId || cleanId.length < 2) {
      return NextResponse.json({ error: 'Érvénytelen madár azonosító (min. 2 karakter, pl. snowy_owl).' }, { status: 400 });
    }

    if (!name || String(name).trim().length < 2) {
      return NextResponse.json({ error: 'A madár neve kötelező (min. 2 karakter).' }, { status: 400 });
    }

    const speed = Number(speedKmH);
    if (isNaN(speed) || speed < 10) {
      return NextResponse.json({ error: 'A repülési sebesség min. 10 km/h kell legyen.' }, { status: 400 });
    }

    const price = Number(priceGold);
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: 'Az ár nem lehet negatív.' }, { status: 400 });
    }

    // Check duplicate
    const existing = await BirdSpecies.findOne({ speciesId: cleanId });
    if (existing) {
      return NextResponse.json({ error: `Ez a fajta azonosító (${cleanId}) már létezik.` }, { status: 409 });
    }

    const newSpecies = await BirdSpecies.create({
      speciesId: cleanId,
      name: String(name).trim(),
      subtitle: String(subtitle).trim(),
      speedKmH: speed,
      priceGold: price,
      minLevel: Math.max(1, Number(minLevel) || 1),
      requirementText: String(requirementText).trim() || (price > 0 ? `${price} arany` : 'Elérhető'),
      avatarBase64: String(avatarBase64 || ''),
      flyingBase64: String(flyingBase64 || ''),
      sizeRank: Math.max(1, Math.min(10, Number(sizeRank) || 1)),
      isActive: Boolean(isActive),
    });

    await createLog('info', 'Admin', `Új madárfajta hozzáadva: ${newSpecies.name} (${cleanId}), Sebesség: ${speed} km/h, Ár: ${price} arany`, { speciesId: cleanId });

    return NextResponse.json(newSpecies, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/admin/species error:', error);
    return NextResponse.json({ error: error.message || 'Hiba történt a mentés során' }, { status: 500 });
  }
}

// PUT /api/admin/species - update existing species
export async function PUT(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { speciesId, _id, ...updates } = body;

    const query = _id ? { _id } : { speciesId };
    const spec = await BirdSpecies.findOne(query);
    if (!spec) {
      return NextResponse.json({ error: 'A madárfajta nem található.' }, { status: 404 });
    }

    if (updates.name !== undefined) spec.name = String(updates.name).trim();
    if (updates.subtitle !== undefined) spec.subtitle = String(updates.subtitle).trim();
    if (updates.speedKmH !== undefined) spec.speedKmH = Math.max(10, Number(updates.speedKmH));
    if (updates.priceGold !== undefined) spec.priceGold = Math.max(0, Number(updates.priceGold));
    if (updates.minLevel !== undefined) spec.minLevel = Math.max(1, Number(updates.minLevel));
    if (updates.requirementText !== undefined) spec.requirementText = String(updates.requirementText).trim();
    if (updates.sizeRank !== undefined) spec.sizeRank = Math.max(1, Math.min(10, Number(updates.sizeRank)));
    if (updates.isActive !== undefined) spec.isActive = Boolean(updates.isActive);
    if (updates.avatarBase64 !== undefined) spec.avatarBase64 = String(updates.avatarBase64);
    if (updates.flyingBase64 !== undefined) spec.flyingBase64 = String(updates.flyingBase64);

    await spec.save();

    await createLog('info', 'Admin', `Madárfajta frissítve: ${spec.name} (${spec.speciesId})`, { speciesId: spec.speciesId });

    return NextResponse.json(spec);
  } catch (error: any) {
    console.error('PUT /api/admin/species error:', error);
    return NextResponse.json({ error: error.message || 'Hiba a frissítés során' }, { status: 500 });
  }
}

// DELETE /api/admin/species?speciesId=...&permanent=true|false
export async function DELETE(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const speciesId = searchParams.get('speciesId');
    const permanent = searchParams.get('permanent') === 'true';

    if (!speciesId) {
      return NextResponse.json({ error: 'Hiányzó speciesId paraméter' }, { status: 400 });
    }

    await connectToDatabase();
    const spec = await BirdSpecies.findOne({ speciesId });
    if (!spec) {
      return NextResponse.json({ error: 'Madárfajta nem található' }, { status: 404 });
    }

    if (permanent) {
      // Check if any user owns this bird
      const ownersCount = await User.countDocuments({ ownedBirds: speciesId });
      if (ownersCount > 0) {
        return NextResponse.json(
          { error: `Nem törölhető véglegesen, mert ${ownersCount} felhasználó birtokolja! Inkább inaktiváld.` },
          { status: 400 }
        );
      }
      await BirdSpecies.deleteOne({ speciesId });
      await createLog('warn', 'Admin', `Madárfajta véglegesen törölve: ${spec.name} (${speciesId})`, { speciesId });
    } else {
      spec.isActive = !spec.isActive;
      await spec.save();
      await createLog('info', 'Admin', `Madárfajta állapota módosítva: ${spec.name} (${speciesId}) -> ${spec.isActive ? 'Aktív' : 'Inaktív'}`, { speciesId });
    }

    return NextResponse.json({ success: true, isActive: spec.isActive });
  } catch (error: any) {
    console.error('DELETE /api/admin/species error:', error);
    return NextResponse.json({ error: error.message || 'Hiba a törlés során' }, { status: 500 });
  }
}
