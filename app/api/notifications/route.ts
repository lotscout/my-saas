import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

interface NotificationItem {
  id: string;
  type: 'message' | 'listing' | 'buyer';
  text: string;
  href: string;
  created_at: string;
}

function displayName(p: { first_name: string | null; last_name: string | null; company_name: string | null }): string {
  if (p.company_name) return p.company_name;
  const name = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
  return name || 'a user';
}

export async function GET() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ items: [] }, { status: 401 });

  const supabase = createServiceClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const items: NotificationItem[] = [];

  // Location comes from the user's profile.
  const { data: profile } = await supabase
    .from('profiles')
    .select('state, county')
    .eq('id', user.id)
    .single();
  const state = (profile as any)?.state ?? null;
  const county = (profile as any)?.county ?? null;

  // 1. Unread messages in conversations the user is part of.
  const { data: convData } = await supabase
    .from('conversations')
    .select('id')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
  const convIds = ((convData ?? []) as any[]).map(c => c.id as string);
  if (convIds.length) {
    const { data: msgData } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, created_at')
      .in('conversation_id', convIds)
      .eq('is_read', false)
      .neq('sender_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15);
    const msgs = (msgData ?? []) as any[];
    const msgConvIds = [...new Set(msgs.map(m => m.conversation_id as string).filter(Boolean))];
    const { data: msgConvs } = msgConvIds.length
      ? await supabase.from('conversations').select('id, buyer_id, seller_id').in('id', msgConvIds)
      : { data: [] };
    const convById = new Map((msgConvs ?? []).map((c: any) => [c.id, c]));

    const senderIds = [...new Set([
      ...msgs.map(m => m.sender_id as string),
      ...(msgConvs ?? []).flatMap((c: any) => [c.buyer_id, c.seller_id]),
    ].filter(Boolean))];
    const namesById: Record<string, string> = {};
    const adminById: Record<string, boolean> = {};
    if (senderIds.length) {
      const { data: senderData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, company_name, is_admin')
        .in('id', senderIds);
      for (const s of (senderData ?? []) as any[]) {
        namesById[s.id as string] = displayName(s);
        adminById[s.id as string] = !!s.is_admin;
      }
    }
    for (const m of msgs) {
      const conv = convById.get(m.conversation_id as string) as any;
      const senderId = m.sender_id as string;
      let displaySenderId = senderId;
      if (adminById[senderId] && conv) {
        displaySenderId = user.id === conv.buyer_id ? conv.seller_id : conv.buyer_id;
      }
      items.push({
        id: `msg-${m.id}`,
        type: 'message',
        text: `New message from ${namesById[displaySenderId] ?? 'a user'}`,
        href: '/messaging',
        created_at: m.created_at as string,
      });
    }
  }

  // 2. New listings in the user's state/county (last 30 days), excluding their own.
  if (state) {
    let q = supabase
      .from('listings')
      .select('id, county, state, created_at')
      .eq('state', state)
      .in('status', ['active', 'published'])
      .gte('created_at', since)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15);
    if (county) q = q.eq('county', county);
    const { data: listingData } = await q;
    for (const l of (listingData ?? []) as any[]) {
      items.push({
        id: `listing-${l.id}`,
        type: 'listing',
        text: `New listing in ${(l.county as string) || (l.state as string)}`,
        href: `/listings/${l.id}`,
        created_at: l.created_at as string,
      });
    }
  }

  // 3. New buyer requests targeting the user's state (last 30 days), excluding their own.
  if (state) {
    const { data: reqData } = await supabase
      .from('buyer_requests')
      .select('id, created_at')
      .contains('target_regions', [state])
      .eq('status', 'active')
      .gte('created_at', since)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15);
    for (const r of (reqData ?? []) as any[]) {
      items.push({
        id: `buyer-${r.id}`,
        type: 'buyer',
        text: `New buyer looking in ${state}`,
        href: '/buyer-directory',
        created_at: r.created_at as string,
      });
    }
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return NextResponse.json({ items: items.slice(0, 15) });
}
