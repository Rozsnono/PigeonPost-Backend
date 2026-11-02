/**
 * Expo Push Notifications Helper for PigeonPost
 * 
 * Documentation: https://docs.expo.dev/push-notifications/sending-notifications/
 */

import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export interface PushNotificationPayload {
  to: string; // Expo Push Token: ExponentPushToken[...]
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

/**
 * Validate whether a string is a valid Expo Push Token format
 */
export function isExpoPushToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
}

/**
 * Send a single push notification via Expo HTTP/2 Push API
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
  if (!isExpoPushToken(payload.to)) {
    return false;
  }

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: payload.to,
        title: payload.title,
        body: payload.body,
        sound: payload.sound ?? 'default',
        channelId: payload.channelId ?? 'pigeonpost-letters',
        priority: payload.priority ?? 'high',
        data: payload.data ?? {},
      }),
    });

    if (!res.ok) {
      console.warn(`[push] Failed to send push: ${res.status} ${res.statusText}`);
      return false;
    }

    const data = await res.json();
    const ticket = data?.data;
    if (ticket?.status === 'error') {
      console.warn('[push] Expo hiba:', ticket.message);
      // Törölt/lejárt eszköztoken: leválasztjuk, hogy ne próbálkozzunk újra feleslegesen
      if (ticket.details?.error === 'DeviceNotRegistered') {
        await connectToDatabase();
        await User.updateMany({ expoPushToken: payload.to }, { $set: { expoPushToken: null } });
      }
      return false;
    }
    return ticket?.status === 'ok';
  } catch (error) {
    console.error('[push] Error sending push notification:', error);
    return false;
  }
}

/**
 * Igaz, ha a felhasználó kikapcsolta az értesítéseket, vagy éppen a csendes órái vannak.
 * (A levél ilyenkor is megérkezik a postaládába, csak a push marad el.)
 */
export function isQuietNow(
  quiet: { enabled?: boolean; startHour?: number; endHour?: number; tzOffsetMinutes?: number } | undefined,
  now: Date = new Date()
): boolean {
  if (!quiet?.enabled) return false;
  const start = quiet.startHour ?? 22;
  const end = quiet.endHour ?? 7;
  if (start === end) return false;
  const localMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + (quiet.tzOffsetMinutes ?? 0) + 1440) % 1440;
  const hour = Math.floor(localMinutes / 60);
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

async function isSuppressedByPreferences(expoPushToken: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const doc = await User.findOne({ expoPushToken }).select('notificationPrefs').lean<{
      notificationPrefs?: { enabled?: boolean; quietHours?: Parameters<typeof isQuietNow>[0] };
    }>();
    const prefs = doc?.notificationPrefs;
    if (prefs?.enabled === false) return true;
    return isQuietNow(prefs?.quietHours);
  } catch (error) {
    // Beállítás-lekérdezési hiba esetén inkább elküldjük az értesítést
    console.warn('[push] Beállítások lekérdezése sikertelen:', error);
    return false;
  }
}

/**
 * Send push notification to a user by looking up their registered Expo Push Token
 */
export async function sendPushToUser(
  user: { expoPushToken?: string | null; username?: string },
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<boolean> {
  if (!user?.expoPushToken) {
    return false;
  }

  if (await isSuppressedByPreferences(user.expoPushToken)) {
    return false;
  }

  return sendPushNotification({
    to: user.expoPushToken,
    title,
    body,
    data,
    channelId: 'pigeonpost-letters',
    sound: 'default',
  });
}
