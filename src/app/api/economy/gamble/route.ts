import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import WheelSlot from '@/models/WheelSlot';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

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

const COOLDOWN_HOURS = 24;

async function getActiveSlots() {
  let slots = await WheelSlot.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
  if (!slots || slots.length === 0) {
    const allSlots = await WheelSlot.find().lean();
    if (!allSlots || allSlots.length === 0) {
      await WheelSlot.insertMany(DEFAULT_WHEEL_SLOTS);
      slots = await WheelSlot.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
    }
  }
  return slots && slots.length > 0 ? slots : DEFAULT_WHEEL_SLOTS;
}

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const user = await User.findById(auth.userId).lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    const lastGambleAt = user.dailyRewards?.lastGambleAt ? new Date(user.dailyRewards.lastGambleAt) : null;
    const now = new Date();

    let canGamble = true;
    let nextGambleAt: Date | null = null;

    if (lastGambleAt) {
      const cooldownEnd = new Date(lastGambleAt.getTime() + COOLDOWN_HOURS * 3600 * 1000);
      if (now < cooldownEnd) {
        canGamble = false;
        nextGambleAt = cooldownEnd;
      }
    }

    const slots = await getActiveSlots();

    return NextResponse.json(
      {
        canGamble,
        nextGambleAt: nextGambleAt ? nextGambleAt.toISOString() : null,
        gold: user.gold ?? 0,
        seeds: user.inventory?.seeds ?? 0,
        slots,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('GET /api/economy/gamble error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const user = await User.findById(auth.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    const lastGambleAt = user.dailyRewards?.lastGambleAt ? new Date(user.dailyRewards.lastGambleAt) : null;
    const now = new Date();

    if (lastGambleAt) {
      const cooldownEnd = new Date(lastGambleAt.getTime() + COOLDOWN_HOURS * 3600 * 1000);
      if (now < cooldownEnd) {
        const minutesRemaining = Math.ceil((cooldownEnd.getTime() - now.getTime()) / 60000);
        return NextResponse.json(
          {
            error: `A napi pörgetés már felhasználva! Várj még ${minutesRemaining} percet az új pörgetésig.`,
            nextGambleAt: cooldownEnd.toISOString(),
          },
          { status: 400, headers: CORS_HEADERS }
        );
      }
    }

    const slots = await getActiveSlots();

    // Weighted random selection
    const totalWeight = slots.reduce((acc: number, s: any) => acc + (s.weight || 1), 0);
    const rand = Math.random() * totalWeight;
    let cumulative = 0;
    let chosenPrize = slots[0];
    let targetIndex = 0;

    for (let i = 0; i < slots.length; i++) {
      cumulative += slots[i].weight || 1;
      if (rand <= cumulative) {
        chosenPrize = slots[i];
        targetIndex = i;
        break;
      }
    }

    // Apply prize to user inventory
    if (!user.inventory) {
      user.inventory = { seeds: 10, cages: 1 };
    }

    if (chosenPrize.type === 'gold') {
      user.gold = (user.gold ?? 0) + chosenPrize.amount;
    } else if (chosenPrize.type === 'seeds') {
      user.inventory.seeds = (user.inventory.seeds ?? 0) + chosenPrize.amount;
    } else if (chosenPrize.type === 'cages') {
      user.inventory.cages = (user.inventory.cages ?? 0) + chosenPrize.amount;
    }

    // Award gamble spin XP (+25 default plus any extra XP prize)
    const xpBonusPrize = chosenPrize.type === 'xp' ? chosenPrize.amount : 0;
    const totalXpEarned = 25 + xpBonusPrize;

    let uLvl = user.level || 1;
    let uXp = (user.xp || 0) + totalXpEarned;
    let userLeveledUp = false;
    while (uXp >= uLvl * 100) {
      uXp -= uLvl * 100;
      uLvl += 1;
      user.gold += uLvl * 25;
      userLeveledUp = true;
    }
    user.level = uLvl;
    user.xp = uXp;

    if (!user.dailyRewards) {
      user.dailyRewards = {
        dailyStreak: 0,
        questsCompletedToday: [],
      };
    }
    user.dailyRewards.lastGambleAt = now;

    await user.save();

    const nextGambleAt = new Date(now.getTime() + COOLDOWN_HOURS * 3600 * 1000);

    return NextResponse.json(
      {
        success: true,
        prize: chosenPrize,
        reward: chosenPrize,
        targetIndex,
        winningIndex: targetIndex,
        slots,
        xpEarned: totalXpEarned,
        userLeveledUp,
        newUserLevel: user.level,
        newUserXp: user.xp,
        newGold: user.gold,
        newSeeds: user.inventory?.seeds,
        newCages: user.inventory?.cages,
        nextGambleAt: nextGambleAt.toISOString(),
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('POST /api/economy/gamble error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
