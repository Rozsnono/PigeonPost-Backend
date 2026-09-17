import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export const GAMBLE_SLOTS = [
  { id: 'gold_25', label: '25 Arany', type: 'gold', amount: 25, weight: 38, rarity: 'common', color: '#f59e0b' },
  { id: 'gold_50', label: '50 Arany', type: 'gold', amount: 50, weight: 30, rarity: 'uncommon', color: '#10b981' },
  { id: 'gold_100', label: '100 Arany', type: 'gold', amount: 100, weight: 15, rarity: 'rare', color: '#38bdf8' },
  { id: 'seeds_15', label: '15 Madármag', type: 'seeds', amount: 15, weight: 9, rarity: 'uncommon', color: '#34d399' },
  { id: 'gold_250', label: '250 Arany', type: 'gold', amount: 250, weight: 5, rarity: 'epic', color: '#a855f7' },
  { id: 'gold_500', label: '500 Arany Jackpot!', type: 'gold', amount: 500, weight: 2.2, rarity: 'legendary', color: '#f43f5e' },
  { id: 'gold_1000', label: '1000 Arany Királyi Kincs!', type: 'gold', amount: 1000, weight: 0.8, rarity: 'mythic', color: '#fbbf24' },
];

const COOLDOWN_HOURS = 24;

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

    return NextResponse.json(
      {
        canGamble,
        nextGambleAt: nextGambleAt ? nextGambleAt.toISOString() : null,
        gold: user.gold ?? 0,
        seeds: user.inventory?.seeds ?? 0,
        slots: GAMBLE_SLOTS,
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

    // Weighted random selection
    const totalWeight = GAMBLE_SLOTS.reduce((acc, s) => acc + s.weight, 0);
    const rand = Math.random() * totalWeight;
    let cumulative = 0;
    let chosenPrize = GAMBLE_SLOTS[0];

    for (const slot of GAMBLE_SLOTS) {
      cumulative += slot.weight;
      if (rand <= cumulative) {
        chosenPrize = slot;
        break;
      }
    }

    // Apply prize
    if (chosenPrize.type === 'gold') {
      user.gold = (user.gold ?? 0) + chosenPrize.amount;
    } else if (chosenPrize.type === 'seeds') {
      if (!user.inventory) user.inventory = { seeds: 10, cages: 1 };
      user.inventory.seeds = (user.inventory.seeds ?? 0) + chosenPrize.amount;
    }

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
        newGold: user.gold,
        newSeeds: user.inventory?.seeds,
        nextGambleAt: nextGambleAt.toISOString(),
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('POST /api/economy/gamble error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
