import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { sendPushToUser } from '@/lib/push';

const HOUR = 3600 * 1000;
const BATCH_LIMIT = 200;
/** Régen inaktív felhasználóknak nem küldünk emlékeztetőt. */
const MAX_INACTIVE_MS = 14 * 24 * HOUR;

interface ReminderUser {
  _id: unknown;
  expoPushToken?: string | null;
  dailyRewards?: {
    lastGambleAt?: Date | null;
    lastDailyClaimAt?: Date | null;
    gambleReminderSentAt?: Date | null;
    streakReminderSentAt?: Date | null;
  };
}

let isRunning = false;

/**
 * Napi emlékeztetők: (1) újra elérhető a napi pörgetés, (2) közeleg a napi bónusz / streak lejárta.
 * Ciklusonként egyszer küld (a *ReminderSentAt mezők alapján). Ha a push elmarad (csendes órák,
 * kikapcsolt értesítés), nem jelöljük elküldöttnek, így a következő futáskor újra próbáljuk.
 */
export async function sendDailyReminders(): Promise<{ gamble: number; streak: number }> {
  if (isRunning) return { gamble: 0, streak: 0 };
  isRunning = true;
  const result = { gamble: 0, streak: 0 };
  try {
    await connectToDatabase();
    const now = Date.now();
    const base = { isDeleted: { $ne: true }, status: { $ne: 'banned' }, expoPushToken: { $ne: null }, 'notificationPrefs.enabled': { $ne: false } };

    // 1) Napi pörgetés: 24 óra letelt az utolsó pörgetés óta
    const gambleCandidates = await User.find({
      ...base,
      'dailyRewards.lastGambleAt': { $lte: new Date(now - 24 * HOUR), $gte: new Date(now - MAX_INACTIVE_MS) },
    })
      .select('expoPushToken dailyRewards')
      .limit(BATCH_LIMIT)
      .lean<ReminderUser[]>();

    for (const u of gambleCandidates) {
      const last = u.dailyRewards?.lastGambleAt;
      const sentAt = u.dailyRewards?.gambleReminderSentAt;
      if (!last || (sentAt && sentAt >= last)) continue;
      const ok = await sendPushToUser(
        { expoPushToken: u.expoPushToken },
        '🎰 Újra pörgethetsz!',
        'A napi szerencsekerék újra elérhető a dúcban.',
        { type: 'daily_gamble' }
      );
      if (ok) {
        await User.updateOne({ _id: u._id }, { $set: { 'dailyRewards.gambleReminderSentAt': new Date() } });
        result.gamble++;
      }
    }

    // 2) Napi bónusz: 20–47 órája vette át utoljára (a streak 48 óra után szakad meg)
    const streakCandidates = await User.find({
      ...base,
      'dailyRewards.lastDailyClaimAt': { $lte: new Date(now - 20 * HOUR), $gte: new Date(now - 47 * HOUR) },
    })
      .select('expoPushToken dailyRewards')
      .limit(BATCH_LIMIT)
      .lean<ReminderUser[]>();

    for (const u of streakCandidates) {
      const last = u.dailyRewards?.lastDailyClaimAt;
      const sentAt = u.dailyRewards?.streakReminderSentAt;
      if (!last || (sentAt && sentAt >= last)) continue;
      const ok = await sendPushToUser(
        { expoPushToken: u.expoPushToken },
        '🔥 Ne szakadjon meg a sorozatod!',
        'Vedd át a napi dúcbónuszt, mielőtt lejár a streak.',
        { type: 'daily_streak' }
      );
      if (ok) {
        await User.updateOne({ _id: u._id }, { $set: { 'dailyRewards.streakReminderSentAt': new Date() } });
        result.streak++;
      }
    }
    return result;
  } finally {
    isRunning = false;
  }
}
