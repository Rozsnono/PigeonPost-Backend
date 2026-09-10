import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import { verifyAuth, unauthorizedResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// PATCH /api/messages/[id]/archive — toggle isArchived
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorizedResponse();

  const { id } = await params;

  try {
    await connectToDatabase();
    const message = await Message.findById(id).lean();
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404, headers: CORS_HEADERS });

    const recipientId = (message.recipientId as any)?.toString?.() ?? String(message.recipientId);
    const senderId = (message.senderId as any)?.toString?.() ?? String(message.senderId);

    if (recipientId !== auth.userId && senderId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: CORS_HEADERS });
    }

    const updated = await Message.findByIdAndUpdate(
      id,
      { isArchived: !message.isArchived },
      { new: true }
    );

    return NextResponse.json({
      message: updated?.isArchived ? 'Archived' : 'Unarchived',
      isArchived: updated?.isArchived,
    }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('PATCH /api/messages/[id]/archive error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
