import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

const BOARDS = {
  distance: { field: 'stats.maxDistance', label: 'Leghosszabb repülés (km)' },
  letters: { field: 'stats.sentCount', label: 'Elküldött levelek' },
  explored: { field: 'totalKmExplored', label: 'Felfedezett távolság (km)' },
} as const;
type BoardType = keyof typeof BOARDS;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const readValue = (doc: Record<string, unknown>, field: string): number => {
  const v = field.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown> | undefined)?.[k], doc);
  return typeof v === 'number' ? v : 0;
};

// GET /api/leaderboard?type=distance|letters|explored — top 20 + a saját helyezés (összesített, nem heti)
export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  const type = (req.nextUrl.searchParams.get('type') || 'distance') as BoardType;
  const board = BOARDS[type];
  if (!board) return NextResponse.json({ error: 'Ismeretlen ranglista' }, { status: 400, headers: CORS_HEADERS });

  try {
    await connectToDatabase();
    const visible = { isDeleted: { $ne: true }, status: { $ne: 'banned' } };

    const top = await User.find({ ...visible, [board.field]: { $gt: 0 } })
      .sort({ [board.field]: -1, createdAt: 1 })
      .limit(20)
      .select(`username avatar level ${board.field}`)
      .lean<Record<string, unknown>[]>();

    const me = await User.findById(auth.userId).select(`username avatar level ${board.field}`).lean<Record<string, unknown> | null>();
    const myValue = me ? readValue(me, board.field) : 0;
    const myRank = myValue > 0 ? (await User.countDocuments({ ...visible, [board.field]: { $gt: myValue } })) + 1 : null;

    return NextResponse.json(
      {
        type,
        label: board.label,
        entries: top.map((u, i) => ({
          rank: i + 1,
          userId: String(u._id),
          username: u.username,
          avatar: u.avatar,
          level: u.level,
          value: Math.round(readValue(u, board.field)),
          isMe: String(u._id) === auth.userId,
        })),
        me: { rank: myRank, value: Math.round(myValue) },
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('GET /api/leaderboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
