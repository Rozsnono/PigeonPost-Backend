import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export const STREAK_REWARDS = [
  { day: 1, gold: 25, seeds: 5, cages: 0, xp: 30, label: 'Kezdő postamester' },
  { day: 2, gold: 40, seeds: 5, cages: 0, xp: 45, label: 'Szorgalmas dúc' },
  { day: 3, gold: 75, seeds: 10, cages: 0, xp: 65, label: 'Megbízható futár' },
  { day: 4, gold: 110, seeds: 10, cages: 0, xp: 90, label: 'Királyi útvonal' },
  { day: 5, gold: 150, seeds: 15, cages: 0, xp: 120, label: 'Hűséges feladó' },
  { day: 6, gold: 200, seeds: 20, cages: 0, xp: 160, label: 'Dúcmester elismerés' },
  { day: 7, gold: 350, seeds: 30, cages: 1, xp: 250, label: '👑 Arany Dúcláda (Főjutalom!)' },
];

function isSameCalendarDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const user = await User.findById(auth.userId).lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    const now = new Date();
    const lastClaimAt = user.dailyRewards?.lastDailyClaimAt ? new Date(user.dailyRewards.lastDailyClaimAt) : null;
    let currentStreak = user.dailyRewards?.dailyStreak ?? 0;

    let canClaim = true;
    if (lastClaimAt) {
      if (isSameCalendarDay(now, lastClaimAt)) {
        canClaim = false;
      } else {
        // If more than 48 hours passed, streak resets
        const hoursPassed = (now.getTime() - lastClaimAt.getTime()) / (3600 * 1000);
        if (hoursPassed > 48) {
          currentStreak = 0;
        }
      }
    }

    const nextDayIndex = canClaim ? (currentStreak % 7) + 1 : currentStreak === 0 ? 1 : ((currentStreak - 1) % 7) + 1;

    return NextResponse.json(
      {
        canClaim,
        currentStreak,
        nextDayIndex,
        rewards: STREAK_REWARDS,
        lastClaimAt: lastClaimAt ? lastClaimAt.toISOString() : null,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('GET /api/economy/daily-streak error:', error);
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

    const now = new Date();
    const lastClaimAt = user.dailyRewards?.lastDailyClaimAt ? new Date(user.dailyRewards.lastDailyClaimAt) : null;
    let currentStreak = user.dailyRewards?.dailyStreak ?? 0;

    if (lastClaimAt && isSameCalendarDay(now, lastClaimAt)) {
      return NextResponse.json({ error: 'A mai dúcbónuszt már átvetted! Gyere vissza holnap.' }, { status: 400, headers: CORS_HEADERS });
    }

    if (lastClaimAt) {
      const hoursPassed = (now.getTime() - lastClaimAt.getTime()) / (3600 * 1000);
      if (hoursPassed > 48) {
        currentStreak = 1;
      } else {
        currentStreak = (currentStreak % 7) + 1;
      }
    } else {
      currentStreak = 1;
    }

    const reward = STREAK_REWARDS.find((r) => r.day === currentStreak) || STREAK_REWARDS[0];

    // Apply rewards
    user.gold = (user.gold ?? 0) + reward.gold;
    if (!user.inventory) user.inventory = { seeds: 10, cages: 1 };
    user.inventory.seeds = (user.inventory.seeds ?? 0) + reward.seeds;
    if (reward.cages > 0) {
      user.inventory.cages = (user.inventory.cages ?? 0) + reward.cages;
    }

    // Award streak XP
    const xpEarned = reward.xp || 30;
    let uLvl = user.level || 1;
    let uXp = (user.xp || 0) + xpEarned;
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
    user.dailyRewards.dailyStreak = currentStreak;
    user.dailyRewards.lastDailyClaimAt = now;

    await user.save();

    return NextResponse.json(
      {
        success: true,
        streakDay: currentStreak,
        reward,
        goldEarned: reward.gold,
        seedsEarned: reward.seeds,
        xpEarned,
        userLeveledUp,
        newUserLevel: user.level,
        newUserXp: user.xp,
        newGold: user.gold,
        newSeeds: user.inventory.seeds,
        newCages: user.inventory.cages,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('POST /api/economy/daily-streak error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
