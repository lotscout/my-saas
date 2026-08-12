import { NextResponse } from 'next/server';
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

export async function GET() {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const service = createServiceClient();
  const todayISO = new Date().toISOString().split('T')[0];

  const [convsRes, profilesForManaged, unreadMsgsRes, activeTodayRes] = await Promise.all([
    service
      .from('conversations')
      .select('id, buyer_id, seller_id, listing_id, last_message_at, last_message_preview, status, subject')
      .neq('status', 'blocked')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(200),
    service
      .from('profiles')
      .select('id')
      .eq('managed_by_lotscout', true)
      // Production may lag this migration; don't break read-only admin visibility.
      .then(res => res.error ? { data: [] } : res),
    service
      .from('messages')
      .select('conversation_id')
      .eq('is_read', false)
      .not('conversation_id', 'is', null),
    service
      .from('messages')
      .select('conversation_id')
      .gte('created_at', todayISO)
      .not('conversation_id', 'is', null),
  ]);

  const convs = convsRes.data ?? [];

  // All unique participant IDs
  const allUserIds = [...new Set([
    ...convs.map(c => c.buyer_id),
    ...convs.map(c => c.seller_id),
  ].filter((id): id is string => !!id))];

  // Fetch all participant profiles
  const profilesRes = allUserIds.length > 0
    ? await service
        .from('profiles')
        .select('id, first_name, last_name, full_name, email, managed_by_lotscout')
        .in('id', allUserIds)
    : { data: [], error: null };

  const { data: profileRows } = profilesRes.error
    ? (allUserIds.length > 0
        ? await service
            .from('profiles')
            .select('id, first_name, last_name, full_name, email')
            .in('id', allUserIds)
        : { data: [] })
    : profilesRes;

  const profileMap: Record<string, {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
    managed_by_lotscout: boolean;
  }> = {};
  for (const p of profileRows ?? []) profileMap[p.id] = { ...p, managed_by_lotscout: 'managed_by_lotscout' in p ? Boolean(p.managed_by_lotscout) : false };

  // Listing info
  const listingIds = [...new Set(convs.map(c => c.listing_id).filter((id): id is string => !!id))];
  const { data: listingRows } = listingIds.length > 0
    ? await service
        .from('listings')
        .select('id, title, street_address, county, state, owner_name')
        .in('id', listingIds)
    : { data: [] };

  const listingMap: Record<string, { id: string; title: string | null; street_address: string | null; county: string | null; state: string | null; owner_name?: string | null }> = {};
  for (const l of listingRows ?? []) listingMap[l.id] = l;

  // Recent messages to determine last sender (for "unresponded" filter)
  const { data: recentMsgs } = await service
    .from('messages')
    .select('conversation_id, sender_id, sender_type, sent_by_admin')
    .order('created_at', { ascending: false })
    .limit(600);

  const lastMsgByConv: Record<string, { sender_id: string | null; sender_type: string; sent_by_admin: boolean }> = {};
  for (const m of recentMsgs ?? []) {
    if (m.conversation_id && !(m.conversation_id in lastMsgByConv)) {
      lastMsgByConv[m.conversation_id] = {
        sender_id: m.sender_id ?? null,
        sender_type: m.sender_type ?? 'user',
        sent_by_admin: m.sent_by_admin ?? false,
      };
    }
  }

  // Unread counts per conversation
  const unreadByConv: Record<string, number> = {};
  for (const m of (unreadMsgsRes.data ?? [])) {
    if (m.conversation_id) unreadByConv[m.conversation_id] = (unreadByConv[m.conversation_id] ?? 0) + 1;
  }

  // Active today — distinct conversation_ids with a message today
  const activeTodayIds = new Set((activeTodayRes.data ?? []).map(m => m.conversation_id).filter(Boolean));

  // Helper: build participant profile
  function buildParticipant(id: string | null, overrideName?: string | null) {
    if (overrideName?.trim()) {
      const initials = overrideName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
      const p = id ? profileMap[id] : null;
      return { id: id ?? '', name: overrideName.trim(), email: p?.email ?? null, initials, managed_by_lotscout: p?.managed_by_lotscout ?? false };
    }
    if (!id) return { id: '', name: 'Unknown', email: null, initials: '?', managed_by_lotscout: false };
    const p = profileMap[id];
    if (!p) return { id, name: 'User', email: null, initials: '?', managed_by_lotscout: false };
    const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email || 'Unknown';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
    return { id, name, email: p.email ?? null, initials, managed_by_lotscout: p.managed_by_lotscout ?? false };
  }

  const enrichedConvs = convs.map(c => {
    const listing = c.listing_id ? (listingMap[c.listing_id] ?? null) : null;
    const buyer  = buildParticipant(c.buyer_id);
    const seller = buildParticipant(c.seller_id, listing?.owner_name);
    const lastMsg = lastMsgByConv[c.id];
    const managedParticipants = [
      buyer.managed_by_lotscout  ? c.buyer_id  : null,
      seller.managed_by_lotscout ? c.seller_id : null,
    ].filter((id): id is string => !!id);

    // "unresponded" = last message from buyer and not from admin/support
    const unresponded = lastMsg
      ? lastMsg.sender_id === c.buyer_id && !lastMsg.sent_by_admin && lastMsg.sender_type === 'user'
      : false;

    return {
      id: c.id,
      buyer_id:  c.buyer_id,
      seller_id: c.seller_id,
      listing_id: c.listing_id,
      subject: c.subject,
      status: c.status,
      last_message_at: c.last_message_at,
      last_message_preview: c.last_message_preview,
      buyer,
      seller,
      listing,
      unread_count: unreadByConv[c.id] ?? 0,
      managed_participants: managedParticipants,
      unresponded,
    };
  });

  // KPIs
  const kpis = {
    totalConversations: convs.length,
    unreadMessages:     (unreadMsgsRes.data ?? []).length,
    managedAccounts:    (profilesForManaged.data ?? []).length,
    activeTodayConvs:   activeTodayIds.size,
  };

  return NextResponse.json({ kpis, conversations: enrichedConvs });
}
