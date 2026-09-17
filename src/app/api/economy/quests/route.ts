import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Message from '@/models/Message';
import Expedition from '@/models/Expedition';
import Pigeon from '@/models/Pigeon';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export const MILESTONES = [
  { id: 'km_50', title: '50 km Szárnyalás', description: 'Tegyél meg összesen 50 km repülési utat', rewardGold: 50, type: 'distance', target: 50 },
  { id: 'km_250', title: '250 km Vándormadár', description: 'Tegyél meg összesen 250 km repülési utat', rewardGold: 150, type: 'distance', target: 250 },
  { id: 'km_1000', title: '1000 km Égi Király', description: 'Tegyél meg összesen 1000 km repülési utat', rewardGold: 450, type: 'distance', target: 1000 },
  { id: 'letters_1', title: 'Első Futár', description: 'Küldj el legalább 1 levelet', rewardGold: 25, type: 'letters', target: 1 },
  { id: 'letters_5', title: 'Rendszeres Levelező', description: 'Küldj el legalább 5 levelet', rewardGold: 100, type: 'letters', target: 5 },
  { id: 'letters_20', title: 'Királyi Postamester', description: 'Küldj el legalább 20 levelet', rewardGold: 300, type: 'letters', target: 20 },
  { id: 'pigeons_3', title: 'Kis Madárraj', description: 'Birtokolj legalább 3 madarat a dúcban', rewardGold: 120, type: 'pigeons', target: 3 },
  { id: 'pigeons_5', title: 'Hatalmas Madárflotta', description: 'Birtokolj legalább 5 madarat a dúcban', rewardGold: 350, type: 'pigeons', target: 5 },
];

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const user = await User.findById(auth.userId).lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Fetch user activity for today
    const [messagesSentToday, expeditionsStartedToday, totalPigeonsCount] = await Promise.all([
      Message.countDocuments({ senderId: auth.userId, createdAt: { $gte: todayStart } }),
      Expedition.countDocuments({ userId: auth.userId, createdAt: { $gte: todayStart } }),
      Pigeon.countDocuments({ ownerId: auth.userId }),
    ]);

    // Calculate today's distance
    const todayMessages = await Message.find({ senderId: auth.userId, createdAt: { $gte: todayStart } }).select('distanceKm').lean();
    const distanceTodayKm = Math.round(todayMessages.reduce((sum, m) => sum + (m.distanceKm || 0), 0));

    const completedQuestsToday = user.dailyRewards?.questsCompletedToday ?? [];
    const claimedMilestones = user.claimedMilestones ?? [];

    const totalDistance = Math.max(user.stats?.maxDistance || 0, distanceTodayKm);

    // 3 Daily Quests
    const dailyQuests = [
      {
        id: 'quest_send_letter',
        title: 'Szárnyaló Üzenet',
        description: 'Küldj el legalább egy levelet egy ismerősödnek.',
        current: Math.min(1, messagesSentToday),
        target: 1,
        rewardGold: 35,
        isCompleted: messagesSentToday >= 1,
        isClaimed: completedQuestsToday.includes('quest_send_letter'),
      },
      {
        id: 'quest_start_expedition',
        title: 'Bátor Felfedező',
        description: 'Indíts útnak egy madarat felfedező útra a dúcból.',
        current: Math.min(1, expeditionsStartedToday),
        target: 1,
        rewardGold: 40,
        isCompleted: expeditionsStartedToday >= 1,
        isClaimed: completedQuestsToday.includes('quest_start_expedition'),
      },
      {
        id: 'quest_distance',
        title: 'Hosszútávú Repülés',
        description: 'Tegyél meg legalább 20 km repülési utat ma.',
        current: Math.min(20, distanceTodayKm),
        target: 20,
        rewardGold: 50,
        isCompleted: distanceTodayKm >= 20,
        isClaimed: completedQuestsToday.includes('quest_distance'),
      },
    ];

    // Format milestones with current progress
    const formattedMilestones = MILESTONES.map((m) => {
      let currentVal = 0;
      if (m.type === 'distance') currentVal = totalDistance;
      if (m.type === 'letters') currentVal = user.stats?.sentCount || 0;
      if (m.type === 'pigeons') currentVal = totalPigeonsCount;

      const isCompleted = currentVal >= m.target;
      const isClaimed = claimedMilestones.includes(m.id);

      return {
        ...m,
        current: Math.min(m.target, currentVal),
        isCompleted,
        isClaimed,
      };
    });

    return NextResponse.json(
      {
        dailyQuests,
        milestones: formattedMilestones,
        gold: user.gold ?? 0,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('GET /api/economy/quests error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const body = await req.json();
    const { type, id } = body; // type: 'quest' | 'milestone'

    const user = await User.findById(auth.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });

    if (!user.dailyRewards) {
      user.dailyRewards = {
        dailyStreak: 0,
        questsCompletedToday: [],
      };
    }
    if (!user.claimedMilestones) {
      user.claimedMilestones = [];
    }

    if (type === 'quest') {
      if (user.dailyRewards.questsCompletedToday?.includes(id)) {
        return NextResponse.json({ error: 'Ezt a küldetésjutalmat ma már átvetted!' }, { status: 400, headers: CORS_HEADERS });
      }

      // Verify requirement
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      let rewardGold = 35;
      if (id === 'quest_send_letter') {
        const count = await Message.countDocuments({ senderId: auth.userId, createdAt: { $gte: todayStart } });
        if (count < 1) return NextResponse.json({ error: 'A feladat még nincs teljesítve!' }, { status: 400, headers: CORS_HEADERS });
        rewardGold = 35;
      } else if (id === 'quest_start_expedition') {
        const count = await Expedition.countDocuments({ userId: auth.userId, createdAt: { $gte: todayStart } });
        if (count < 1) return NextResponse.json({ error: 'A feladat még nincs teljesítve!' }, { status: 400, headers: CORS_HEADERS });
        rewardGold = 40;
      } else if (id === 'quest_distance') {
        const msgs = await Message.find({ senderId: auth.userId, createdAt: { $gte: todayStart } }).select('distanceKm').lean();
        const dist = Math.round(msgs.reduce((sum, m) => sum + (m.distanceKm || 0), 0));
        if (dist < 20) return NextResponse.json({ error: 'A feladat még nincs teljesítve!' }, { status: 400, headers: CORS_HEADERS });
        rewardGold = 50;
      }

      user.gold = (user.gold ?? 0) + rewardGold;
      user.dailyRewards.questsCompletedToday.push(id);
      await user.save();

      return NextResponse.json({ success: true, goldEarned: rewardGold, newGold: user.gold });
    }

    if (type === 'milestone') {
      if (user.claimedMilestones.includes(id)) {
        return NextResponse.json({ error: 'Ezt a mérföldkövet már átvetted!' }, { status: 400, headers: CORS_HEADERS });
      }

      const ms = MILESTONES.find((m) => m.id === id);
      if (!ms) return NextResponse.json({ error: 'Mérföldkő nem található!' }, { status: 404, headers: CORS_HEADERS });

      user.gold = (user.gold ?? 0) + ms.rewardGold;
      user.claimedMilestones.push(id);
      await user.save();

      return NextResponse.json({ success: true, goldEarned: ms.rewardGold, newGold: user.gold });
    }

    return NextResponse.json({ error: 'Érvénytelen kérés!' }, { status: 400, headers: CORS_HEADERS });
  } catch (error) {
    console.error('POST /api/economy/quests error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
