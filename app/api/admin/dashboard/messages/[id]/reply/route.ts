import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  const service = createServiceClient();
  const { data } = await service.from('profiles').select('*').eq('id', user.id).single();
  return data?.is_admin === true;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id: conversationId } = await params;
  const { sender_id, body } = await req.json() as { sender_id: string; body: string };

  if (!sender_id || !body?.trim()) {
    return NextResponse.json({ error: 'sender_id and body are required' }, { status: 400 });
  }

  const service = createServiceClient();

  // Verify sender is a managed participant in this conversation
  const { data: conv } = await service
    .from('conversations')
    .select('id, buyer_id, seller_id, listing_id')
    .eq('id', conversationId)
    .single();

  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

  const { data: senderProfile } = await service
    .from('profiles')
    .select('managed_by_lotscout')
    .eq('id', sender_id)
    .single();

  if (!senderProfile?.managed_by_lotscout) {
    return NextResponse.json({ error: 'Sender is not a managed account' }, { status: 403 });
  }

  const recipientId = sender_id === conv.buyer_id ? conv.seller_id : conv.buyer_id;
  const trimmed = body.trim();

  const { data: message, error } = await service
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id,
      recipient_id: recipientId,
      body: trimmed,
      sent_by_admin: true,
      sender_type: 'user',
    })
    .select('id, sender_id, body, created_at, sent_by_admin, sender_type')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update conversation preview (non-blocking)
  const preview = trimmed.length > 100 ? trimmed.slice(0, 100) + '…' : trimmed;
  service
    .from('conversations')
    .update({ last_message_at: message.created_at, last_message_preview: preview })
    .eq('id', conversationId)
    .then(({ error: e }) => { if (e) console.warn('[admin/messages/reply] preview update failed:', e); });

  let senderName = 'Managed User';
  if (sender_id === conv.seller_id && conv.listing_id) {
    const { data: listing } = await service
      .from('listings')
      .select('owner_name')
      .eq('id', conv.listing_id)
      .single();
    if (listing?.owner_name?.trim()) senderName = listing.owner_name.trim();
  }
  if (senderName === 'Managed User') {
    const { data: profile } = await service
      .from('profiles')
      .select('first_name, last_name, full_name, email')
      .eq('id', sender_id)
      .single();
    senderName = profile?.full_name
      || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
      || profile?.email
      || senderName;
  }

  return NextResponse.json({ message: { ...message, sender_name: senderName, sender_type: 'user' } });
}
