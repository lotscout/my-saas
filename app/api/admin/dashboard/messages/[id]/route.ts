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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const service = createServiceClient();

  const { data: conv } = await service
    .from('conversations')
    .select('id, buyer_id, seller_id, listing_id')
    .eq('id', id)
    .single();

  const { data: listing } = conv?.listing_id
    ? await service
        .from('listings')
        .select('id, owner_name')
        .eq('id', conv.listing_id)
        .single()
    : { data: null };

  const { data: messages, error } = await service
    .from('messages')
    .select('id, sender_id, body, created_at, is_read, sent_by_admin, sender_type')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const senderIds = [...new Set((messages ?? []).map(m => m.sender_id).filter((id): id is string => !!id))];
  const profilesRes = senderIds.length > 0
    ? await service
        .from('profiles')
        .select('id, first_name, last_name, full_name, email, managed_by_lotscout')
        .in('id', senderIds)
    : { data: [], error: null };

  const { data: profiles } = profilesRes.error
    ? (senderIds.length > 0
        ? await service
            .from('profiles')
            .select('id, first_name, last_name, full_name, email')
            .in('id', senderIds)
        : { data: [] })
    : profilesRes;

  const profileMap: Record<string, { name: string; managed: boolean }> = {};
  for (const p of profiles ?? []) {
    const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email || 'Unknown';
    profileMap[p.id] = { name, managed: 'managed_by_lotscout' in p ? Boolean(p.managed_by_lotscout) : false };
  }

  const enriched = (messages ?? []).map(m => ({
    id:           m.id,
    sender_id:    m.sender_id,
    body:         m.body,
    created_at:   m.created_at,
    is_read:      m.is_read,
    sent_by_admin: m.sent_by_admin ?? false,
    sender_type:  m.sender_type ?? 'user',
    sender_name:  m.sender_type === 'support'
      ? 'LotScout Support'
      : (m.sender_id && conv?.seller_id === m.sender_id && listing?.owner_name?.trim())
        ? listing.owner_name.trim()
        : (m.sender_id ? (profileMap[m.sender_id]?.name ?? 'Unknown') : 'Unknown'),
  }));

  return NextResponse.json({ messages: enriched });
}
