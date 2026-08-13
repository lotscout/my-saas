import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getAdminUser } from '@/lib/admin-server';

export const dynamic = 'force-dynamic';

// POST /api/admin/messages/send  { conversation_id, body }
// Inserts an admin/support reply into the conversation's message thread so BOTH
// participants see it. The message is attributed to the signed-in admin, whose id is
// neither the buyer nor the seller — that is how the thread view labels it "LotScout Support".
export async function POST(req: NextRequest) {
  const admin = await getAdminUser(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { conversation_id, body } = (await req.json()) as { conversation_id?: string; body?: string };
  if (!conversation_id || !body?.trim()) {
    return NextResponse.json({ error: 'conversation_id and body are required' }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: conv } = await service
    .from('conversations')
    .select('id, buyer_id, seller_id')
    .eq('id', conversation_id)
    .maybeSingle();
  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

  const trimmed = body.trim();
  const senderId = conv.seller_id || conv.buyer_id || admin.id;

  // Attribute admin-entered support replies to the conversation participant so
  // user-facing notifications show the real buyer/seller name, never "Admin User".
  const { data: inserted, error } = await service
    .from('messages')
    .insert({ conversation_id, sender_id: senderId, body: trimmed })
    .select('id, conversation_id, sender_id, body, is_read, created_at')
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message ?? 'Failed to send' }, { status: 500 });
  }

  // Keep the conversations preview cache warm too (best-effort; the view no longer relies on it).
  const preview = trimmed.length > 120 ? trimmed.slice(0, 120) + '…' : trimmed;
  service
    .from('conversations')
    .update({ last_message_at: inserted.created_at, last_message_preview: preview })
    .eq('id', conversation_id)
    .then(({ error: e }) => { if (e) console.warn('[admin/messages/send] preview update failed:', e); });

  return NextResponse.json({
    message: {
      id: inserted.id,
      sender_id: inserted.sender_id,
      body: inserted.body,
      created_at: inserted.created_at,
      is_read: inserted.is_read ?? false,
      role: senderId === conv.seller_id ? 'seller' : senderId === conv.buyer_id ? 'buyer' : 'admin',
      is_admin: false,
      sender_name: 'Sent by LotScout',
    },
  });
}
