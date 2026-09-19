import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import Expedition from '@/models/Expedition';
import ExpeditionCity, { DEFAULT_EXPEDITION_CITIES } from '@/models/ExpeditionCity';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const BIRD_SIZE_RANK: Record<string, number> = {
  falcon_express: 5,
  phoenix_express: 5,
  frost_phoenix: 5,
  golden_eagle: 4,
  peregrine: 3,
  raven: 3,
  barn_owl: 3,
  snowy_owl: 3,
  pigeon: 2,
  turtle_dove: 2,
  starling: 1,
  peacock: 4,
  penguin: 3,
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(15, Math.round(R * c));
}

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();

    const user = await User.findById(auth.userId).select('location stamps').lean();
    const userLat = (user as any)?.location?.lat || 47.4979;
    const userLng = (user as any)?.location?.lng || 19.0402;

    // Load active expedition cities from DB, or seed defaults
    let cities = await ExpeditionCity.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
    if (!cities || cities.length === 0) {
      await ExpeditionCity.insertMany(DEFAULT_EXPEDITION_CITIES);
      cities = await ExpeditionCity.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
    }

    const destinations = cities.map((city: any) => {
      const distKm = calculateDistanceKm(userLat, userLng, city.lat, city.lng);
      const mult = city.rewardMultiplier || 1.0;
      // Duration estimation at baseline 80 km/h speed
      const durationMinutes = Math.max(15, Math.round((distKm / 80) * 60));

      const minGold = Math.max(25, Math.round(distKm * 0.45 * mult));
      const maxGold = Math.max(45, Math.round(distKm * 0.85 * mult));
      const minSeeds = Math.max(5, Math.round((distKm / 15) * Math.min(2.0, mult)));
      const maxSeeds = Math.max(10, Math.round((distKm / 8) * Math.min(2.0, mult)));

      return {
        id: city.cityId,
        cityId: city.cityId,
        name: city.name,
        country: city.country,
        lat: city.lat,
        lng: city.lng,
        description: city.description,
        icon: city.icon || 'monument',
        minLevel: city.minLevel || 1,
        rewardMultiplier: mult,
        cageDropChance: city.cageDropChance || 5,
        stamps: city.stamps || [],
        distanceKm: distKm,
        durationMinutes,
        minGold,
        maxGold,
        minSeeds,
        maxSeeds,
      };
    });

    const now = new Date();
    const expeditions = await Expedition.find({
      userId: auth.userId,
      status: { $in: ['exploring', 'completed'] },
    })
      .populate('pigeonId', 'name species level status')
      .sort({ createdAt: -1 })
      .lean();

    const citiesMap = new Map(cities.map((c: any) => [c.cityId, c]));

    // Auto-update completed expeditions
    const formatted = expeditions.map((exp: any) => {
      const returnTime = new Date(exp.estimatedReturnAt).getTime();
      const isCompleted = now.getTime() >= returnTime || exp.status === 'completed';
      const minutesLeft = Math.max(0, Math.round((returnTime - now.getTime()) / 60000));
      const totalDuration = (exp.durationMinutes || 30) * 60000;
      const elapsed = Math.max(0, now.getTime() - new Date(exp.dispatchedAt).getTime());
      const progress = isCompleted ? 100 : Math.min(99, Math.round((elapsed / totalDuration) * 100));

      if (isCompleted && exp.status === 'exploring') {
        Expedition.findByIdAndUpdate(exp._id, { status: 'completed' }).exec();
      }

      const city = exp.cityId ? citiesMap.get(exp.cityId) : null;

      return {
        ...exp,
        destinationLat: exp.destinationLat ?? city?.lat,
        destinationLng: exp.destinationLng ?? city?.lng,
        destinationCountry: city?.country,
        destinationIcon: city?.icon || 'monument',
        isCompleted,
        minutesLeft,
        progress,
      };
    });

    return NextResponse.json(
      {
        expeditions: formatted,
        destinations,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('GET /api/economy/expeditions error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const body = await req.json();
    const { action } = body;

    // ─── 1. START EXPEDITION ──────────────────────────────────────────────────
    if (action === 'start') {
      const { pigeonId, destinationId, cityId } = body;
      const targetCityId = (cityId || destinationId || '').trim();
      if (!pigeonId || !targetCityId) {
        return NextResponse.json(
          { error: 'Madár és célváros megadása kötelező!' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const isObjectId = mongoose.Types.ObjectId.isValid(targetCityId) && targetCityId.length === 24;
      let city = await ExpeditionCity.findOne(
        isObjectId ? { $or: [{ cityId: targetCityId }, { _id: targetCityId }] } : { cityId: targetCityId }
      );
      if (!city) {
        city = await ExpeditionCity.findOne({
          $or: [
            { cityId: targetCityId.toLowerCase() },
            { name: new RegExp(`^${targetCityId}$`, 'i') },
          ],
        });
      }

      if (!city) {
        const count = await ExpeditionCity.countDocuments();
        if (count === 0) {
          await ExpeditionCity.insertMany(DEFAULT_EXPEDITION_CITIES);
          city = await ExpeditionCity.findOne({ cityId: targetCityId });
        }
      }

      if (!city) {
        return NextResponse.json(
          { error: 'A kiválasztott expedíciós város nem található!' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const user = await User.findById(auth.userId);
      if (!user) return unauthorizedResponse();

      if ((user.level || 1) < (city.minLevel || 1)) {
        return NextResponse.json(
          { error: `Ehhez a városhoz legalább ${city.minLevel}. szintű Dúcmesternek kell lenned!` },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      if (!mongoose.Types.ObjectId.isValid(pigeonId)) {
        return NextResponse.json(
          { error: 'Érvénytelen madár azonosító!' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const pigeon = await Pigeon.findById(pigeonId);
      if (!pigeon || pigeon.ownerId.toString() !== auth.userId) {
        return NextResponse.json(
          { error: 'A kiválasztott madár nem található a dúcodban!' },
          { status: 404, headers: CORS_HEADERS }
        );
      }
      if (pigeon.status !== 'idle') {
        return NextResponse.json(
          { error: `A madár jelenleg ${pigeon.status} állapotban van, csak tétlen madár indítható útnak!` },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      if (pigeon.fatigue >= 100) {
        return NextResponse.json(
          { error: `"${pigeon.name}" teljesen kimerült (100% fáradtság)! Etesd meg a dúc vályújából vagy pihentesd indulás előtt.` },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      if (pigeon.satiety !== undefined && pigeon.satiety <= 0) {
        return NextResponse.json(
          { error: `"${pigeon.name}" nagyon éhes (0% jóllakottság)! Tölts magot a dúc etetővályújába az indulás előtt.` },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const userLat = user.location?.lat || 47.4979;
      const userLng = user.location?.lng || 19.0402;
      const distKm = calculateDistanceKm(userLat, userLng, city.lat, city.lng);

      // Bird quality & speed scaling
      const birdSpeed = Math.max(60, pigeon.speedKmH || 80);
      const birdLevel = Math.max(1, pigeon.level || 1);
      const sizeRank = BIRD_SIZE_RANK[pigeon.species] || 2;

      // Flight time scaling
      const speedFactor = Math.max(0.25, 80 / birdSpeed);
      const levelSpeedBonus = 1 - Math.min(0.20, (birdLevel - 1) * 0.05);
      const baseDurationMinutes = Math.max(15, Math.round((distKm / 80) * 60));
      const effectiveDurationMinutes = Math.max(
        3,
        Math.round(baseDurationMinutes * speedFactor * levelSpeedBonus)
      );

      const now = new Date();
      const estimatedReturnAt = new Date(now.getTime() + effectiveDurationMinutes * 60000);

      // Value & Reward scaling with City Multiplier
      const levelMultiplier = 1 + (birdLevel - 1) * 0.20;
      const speedRewardMultiplier = 1 + Math.max(0, (birdSpeed - 80) / 130);
      const rankMultiplier = 1 + Math.max(0, (sizeRank - 2) * 0.12);
      const cityMult = city.rewardMultiplier || 1.0;
      const totalRewardMultiplier = levelMultiplier * speedRewardMultiplier * rankMultiplier * cityMult;

      const baseGold = distKm * (0.55 + Math.random() * 0.35);
      const gold = Math.max(25, Math.round(baseGold * totalRewardMultiplier));

      const baseSeeds = (distKm / 12) * (0.8 + Math.random() * 0.4);
      const seedBonus = 1 + (birdLevel - 1) * 0.15 + (birdSpeed >= 120 ? 0.35 : 0);
      const seeds = Math.max(5, Math.round(baseSeeds * seedBonus));

      // Cage drop chance roll
      const rollCage = Math.random() * 100;
      const wonCage = rollCage < (city.cageDropChance || 5) ? 1 : 0;

      // Stamp roll: Pick 1 stamp from city's possible stamps, prioritizing uncollected ones
      let wonStamp = null;
      if (city.stamps && city.stamps.length > 0) {
        const userStampIds = new Set((user.stamps || []).map((s: any) => s.id || s.code));
        const uncollectedStamps = city.stamps.filter(
          (s: any) => !userStampIds.has(s.id) && !userStampIds.has(s.code)
        );

        const candidates = uncollectedStamps.length > 0 ? uncollectedStamps : city.stamps;
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        wonStamp = {
          id: selected.id,
          code: selected.code,
          name: selected.name,
          country: selected.country || city.country,
          image: selected.image || null,
        };
      }

      const expedition = await Expedition.create({
        userId: auth.userId,
        pigeonId: pigeon._id,
        destinationName: `${city.name} (${city.country})`,
        cityId: city.cityId,
        destinationLat: city.lat,
        destinationLng: city.lng,
        distanceKm: distKm,
        durationMinutes: effectiveDurationMinutes,
        dispatchedAt: now,
        estimatedReturnAt,
        rewardGold: gold,
        rewardSeeds: seeds,
        rewardCages: wonCage,
        rewardStamp: wonStamp,
        rewardStampId: wonStamp?.id || null,
        status: 'exploring',
      });

      pigeon.status = 'flying';
      pigeon.fatigue = Math.min(100, (pigeon.fatigue || 0) + Math.max(5, Math.round(effectiveDurationMinutes / 5)));
      pigeon.satiety = Math.max(0, (pigeon.satiety ?? 100) - Math.max(8, Math.round(effectiveDurationMinutes / 4)));
      await pigeon.save();

      return NextResponse.json(
        {
          success: true,
          message: `${pigeon.name} sikeresen elindult ${city.name} (${city.country}) felé!`,
          expedition,
        },
        { status: 201, headers: CORS_HEADERS }
      );
    }

    // ─── 2. CLAIM EXPEDITION REWARDS ──────────────────────────────────────────
    if (action === 'claim') {
      const { expeditionId } = body;
      if (!expeditionId || !mongoose.Types.ObjectId.isValid(expeditionId)) {
        return NextResponse.json({ error: 'Hiányzó vagy érvénytelen expeditionId!' }, { status: 400, headers: CORS_HEADERS });
      }

      const expedition = await Expedition.findById(expeditionId);
      if (!expedition || expedition.userId.toString() !== auth.userId) {
        return NextResponse.json({ error: 'Expedíció nem található!' }, { status: 404, headers: CORS_HEADERS });
      }
      if (expedition.status === 'claimed') {
        return NextResponse.json({ error: 'A zsákmányt már átvetted!' }, { status: 400, headers: CORS_HEADERS });
      }

      const now = new Date();
      if (now.getTime() < new Date(expedition.estimatedReturnAt).getTime() && expedition.status !== 'completed') {
        return NextResponse.json({ error: 'A madár még nem tért vissza a felfedező útról!' }, { status: 400, headers: CORS_HEADERS });
      }

      // Credit rewards & XP to user
      const user = await User.findById(auth.userId);
      const dist = expedition.distanceKm || 60;
      const userXpEarned = Math.max(30, Math.round(dist * 0.4 + (expedition.rewardGold || 30) * 0.3));
      let userLeveledUp = false;

      let awardedStamp = null;
      let isNewStamp = false;
      const awardedCages = expedition.rewardCages || 0;

      if (user) {
        user.gold = (user.gold ?? 0) + expedition.rewardGold;
        if (!user.inventory) user.inventory = { seeds: 10, cages: 1 };
        user.inventory.seeds = (user.inventory.seeds ?? 0) + expedition.rewardSeeds;
        if (awardedCages > 0) {
          user.inventory.cages = (user.inventory.cages ?? 1) + awardedCages;
        }

        user.totalKmExplored = (user.totalKmExplored ?? 0) + dist;

        // Add stamp to user collection if won
        if (expedition.rewardStamp && expedition.rewardStamp.id) {
          if (!user.stamps) user.stamps = [];
          const existingStampIdx = user.stamps.findIndex(
            (s: any) => s.id === expedition.rewardStamp.id || s.code === expedition.rewardStamp.code
          );

          if (existingStampIdx >= 0) {
            user.stamps[existingStampIdx].count = (user.stamps[existingStampIdx].count || 1) + 1;
            awardedStamp = {
              ...expedition.rewardStamp,
              count: user.stamps[existingStampIdx].count,
            };
            isNewStamp = false;
          } else {
            const newStampObj = {
              id: expedition.rewardStamp.id,
              code: expedition.rewardStamp.code,
              name: expedition.rewardStamp.name,
              country: expedition.rewardStamp.country,
              count: 1,
              image: expedition.rewardStamp.image || undefined,
              unlockedAt: new Date(),
            };
            user.stamps.push(newStampObj);
            awardedStamp = newStampObj;
            isNewStamp = true;
          }
        }

        // XP & Level-up handling
        let uLvl = user.level || 1;
        let uXp = (user.xp || 0) + userXpEarned;
        while (uXp >= uLvl * 100) {
          uXp -= uLvl * 100;
          uLvl += 1;
          user.gold += uLvl * 30; // Level up bonus
          userLeveledUp = true;
        }
        user.level = uLvl;
        user.xp = uXp;
        await user.save();
      }

      // Restore pigeon to idle & award Pigeon XP
      let pigeonLeveledUp = false;
      const pigeonXpEarned = Math.max(35, Math.round(dist * 0.5 + 15));
      let pigeonName = 'A madár';
      let pigeonLevel = 1;
      let pigeonXp = 0;

      if (expedition.pigeonId) {
        const pigeon = await Pigeon.findById(expedition.pigeonId);
        if (pigeon) {
          pigeon.status = 'idle';
          pigeonName = pigeon.name;
          let pLvl = pigeon.level || 1;
          let pXp = (pigeon.xp || 0) + pigeonXpEarned;
          while (pXp >= pLvl * 100) {
            pXp -= pLvl * 100;
            pLvl += 1;
            pigeon.speedKmH = (pigeon.speedKmH || 80) + 2; // +2 km/h permanent speed per level
            pigeonLeveledUp = true;
          }
          pigeon.level = pLvl;
          pigeon.xp = pXp;
          pigeonLevel = pLvl;
          pigeonXp = pXp;
          await pigeon.save();
        }
      }

      expedition.status = 'claimed';
      await expedition.save();

      return NextResponse.json(
        {
          success: true,
          goldEarned: expedition.rewardGold,
          seedsEarned: expedition.rewardSeeds,
          cagesEarned: awardedCages,
          stampEarned: awardedStamp,
          isNewStamp,
          userXpEarned,
          pigeonXpEarned,
          userLeveledUp,
          newUserLevel: user?.level || 1,
          newUserXp: user?.xp || 0,
          pigeonLeveledUp,
          newPigeonLevel: pigeonLevel,
          newPigeonXp: pigeonXp,
          pigeonName,
          reward: {
            gold: expedition.rewardGold,
            seeds: expedition.rewardSeeds,
            cages: awardedCages,
            stamp: awardedStamp,
            xp: userXpEarned,
            pigeonXp: pigeonXpEarned,
          },
          newGold: user?.gold,
          newSeeds: user?.inventory?.seeds,
          newCages: user?.inventory?.cages,
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { error: 'Érvénytelen action (start vagy claim szükséges)!' },
      { status: 400, headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('POST /api/economy/expeditions error:', error);
    return NextResponse.json(
      { error: error?.message || 'Belső szerverhiba történt az expedíció során!' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
