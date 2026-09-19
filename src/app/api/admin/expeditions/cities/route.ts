import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ExpeditionCity, { DEFAULT_EXPEDITION_CITIES } from '@/models/ExpeditionCity';
import { createLog } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (req.headers.get('authorization') !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    let cities = await ExpeditionCity.find().sort({ order: 1, createdAt: 1 }).lean();

    if (!cities || cities.length === 0) {
      await ExpeditionCity.insertMany(DEFAULT_EXPEDITION_CITIES);
      cities = await ExpeditionCity.find().sort({ order: 1, createdAt: 1 }).lean();
    }

    return NextResponse.json({ cities });
  } catch (error: any) {
    console.error('GET /api/admin/expeditions/cities error:', error);
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
    const {
      _id,
      cityId,
      name,
      country,
      lat,
      lng,
      description,
      icon,
      minLevel,
      rewardMultiplier,
      cageDropChance,
      stamps,
      isActive,
      order,
    } = body;

    if (!name || !country || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'A név, ország és koordináták (lat, lng) megadása kötelező!' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let city;
    if (_id) {
      city = await ExpeditionCity.findById(_id);
    } else if (cityId) {
      city = await ExpeditionCity.findOne({ cityId });
    }

    const cleanStamps = Array.isArray(stamps)
      ? stamps.map((s: any, idx: number) => ({
          id: s.id || `stamp_${(name || 'city').toLowerCase().replace(/\s+/g, '_')}_${idx + 1}`,
          code: (s.code || `${(country || 'XX').slice(0, 2).toUpperCase()}-0${idx + 1}`).trim(),
          name: (s.name || 'Bélyeg').trim(),
          country: (s.country || country).trim(),
          image: s.image || null,
        }))
      : [];

    if (city) {
      city.name = name.trim();
      city.country = country.trim();
      city.lat = Number(lat);
      city.lng = Number(lng);
      if (description !== undefined) city.description = description;
      if (icon) city.icon = icon;
      if (minLevel !== undefined) city.minLevel = Math.max(1, Number(minLevel));
      if (rewardMultiplier !== undefined) city.rewardMultiplier = Math.max(0.1, Number(rewardMultiplier));
      if (cageDropChance !== undefined) city.cageDropChance = Math.max(0, Math.min(100, Number(cageDropChance)));
      if (stamps !== undefined) city.stamps = cleanStamps;
      if (isActive !== undefined) city.isActive = Boolean(isActive);
      if (order !== undefined) city.order = Number(order);

      await city.save();

      await createLog(
        'info',
        'Admin',
        `Admin frissítette a várost: ${city.name} (${city.country})`
      );

      return NextResponse.json({ success: true, city });
    } else {
      const generatedId = (cityId || name.toLowerCase().replace(/[^a-z0-9]/g, '_')).trim();
      const newCity = await ExpeditionCity.create({
        cityId: generatedId,
        name: name.trim(),
        country: country.trim(),
        lat: Number(lat),
        lng: Number(lng),
        description: description || '',
        icon: icon || 'monument',
        minLevel: Math.max(1, Number(minLevel) || 1),
        rewardMultiplier: Math.max(0.1, Number(rewardMultiplier) || 1.0),
        cageDropChance: Math.max(0, Math.min(100, Number(cageDropChance) || 5)),
        stamps: cleanStamps,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        order: Number(order) || 0,
      });

      await createLog(
        'info',
        'Admin',
        `Admin új várost hozott létre: ${newCity.name} (${newCity.country})`
      );

      return NextResponse.json({ success: true, city: newCity });
    }
  } catch (error: any) {
    console.error('POST /api/admin/expeditions/cities error:', error);
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
      return NextResponse.json({ error: 'Missing city ID' }, { status: 400 });
    }

    await connectToDatabase();
    const city = await ExpeditionCity.findOneAndDelete({ $or: [{ _id: id }, { cityId: id }] });

    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    await createLog(
      'warn',
      'Admin',
      `Admin törölte a várost: ${city.name} (${city.cityId})`
    );

    return NextResponse.json({ success: true, message: 'City deleted' });
  } catch (error: any) {
    console.error('DELETE /api/admin/expeditions/cities error:', error);
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
    await ExpeditionCity.deleteMany({});
    await ExpeditionCity.insertMany(DEFAULT_EXPEDITION_CITIES);

    await createLog(
      'warn',
      'Admin',
      'Admin visszaállította az alapértelmezett expedíciós városokat'
    );

    const cities = await ExpeditionCity.find().sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json({ success: true, message: 'Városok visszaállítva alapértelmezettre', cities });
  } catch (error: any) {
    console.error('PUT /api/admin/expeditions/cities error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
