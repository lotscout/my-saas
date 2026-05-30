import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (isAdminEmail(user.email)) return user;
  const service = createServiceClient();
  const { data } = await service.from('profiles').select('is_admin').eq('id', user.id).single();
  return data?.is_admin === true ? user : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id: conversationId } = await params;
  const { body } = await req.json() as { body: string };

  if (!body?.trim()) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: conv } = await service
    .from('conversations')
    .select('id, buyer_id, seller_id')
    .eq('id', conversationId)
    .single();

  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

  const trimmed = body.trim();

  const { data: message, error } = await service
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id:    adminUser.id,
      recipient_id: conv.buyer_id, // support messages target buyer
      body:         trimmed,
      sent_by_admin: true,
      sender_type:  'support',
    })
    .select('id, sender_id, body, created_at, sent_by_admin, sender_type')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const preview = trimmed.length > 100 ? trimmed.slice(0, 100) + '…' : trimmed;
  service
    .from('conversations')
    .update({ last_message_at: message.created_at, last_message_preview: preview })
    .eq('id', conversationId)
    .then(({ error: e }) => { if (e) console.warn('[admin/messages/support] preview update failed:', e); });

  return NextResponse.json({ message: { ...message, sender_name: 'LotScout Support' } });
}
