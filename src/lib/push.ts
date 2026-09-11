/**
 * Expo Push Notifications Helper for PigeonPost
 * 
 * Documentation: https://docs.expo.dev/push-notifications/sending-notifications/
 */

export interface PushNotificationPayload {
  to: string; // Expo Push Token: ExponentPushToken[...]
  title: string;
  body: string;
  data?: Record<string, any>;
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
    return data?.data?.status === 'ok';
  } catch (error) {
    console.error('[push] Error sending push notification:', error);
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
  data: Record<string, any> = {}
): Promise<boolean> {
  if (!user?.expoPushToken) {
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
