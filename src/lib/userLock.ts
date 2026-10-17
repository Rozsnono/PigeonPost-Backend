import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';

/**
 * Felhasználónkénti sorosítás a gazdasági (érme/mag/XP-módosító) végpontokhoz.
 * Megakadályozza, hogy ugyanazon felhasználó párhuzamos kérései egymás
 * read-modify-write műveletét felülírják (dupla jutalom, dupla költés).
 *
 * FIGYELEM: csak egyetlen szerverfolyamaton belül véd. Több példány esetén
 * az egyszeri jutalmaknál (gamble, napi streak) emellett az atomi `claimOnce` is véd.
 */
const tails = new Map<string, Promise<unknown>>();

export function withUserLock<A extends unknown[]>(
  handler: (req: NextRequest, ...rest: A) => Promise<Response>
) {
  return async (req: NextRequest, ...rest: A): Promise<Response> => {
    const auth = verifyAuth(req);
    if (!auth) return handler(req, ...rest); // a handler maga adja a 401-et

    const key = auth.userId;
    const prev = tails.get(key) ?? Promise.resolve();
    const run = prev.catch(() => undefined).then(() => handler(req, ...rest));
    const tail = run.catch(() => undefined);
    tails.set(key, tail);
    try {
      return await run;
    } finally {
      if (tails.get(key) === tail) tails.delete(key);
    }
  };
}
