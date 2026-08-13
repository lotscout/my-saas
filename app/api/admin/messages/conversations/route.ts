import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsAdmin } from '@/lib/admin-server';
import { getBuyerName } from '@/lib/getBuyerName';
import { getSellerName } from '@/lib/getSellerName';

// Always render fresh — this view must never serve a cached/stale conversation list.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
};

// Resolve a buyer profile to a safe display name (seed / uploader / test names filtered).
function buyerDisplay(p: ProfileRow | undefined): string {
  if (!p) return 'Buyer';
  return getBuyerName({
    first_name: p.first_name,
    last_name: p.last_name,
    display_company: p.company_name,
    display_name: p.full_name,
    profiles: { first_name: p.first_name, last_name: p.last_name, company_name: p.company_name },
  });
}

// Resolve a seller profile to a safe display name (seed / uploader / test names filtered).
function sellerDisplay(p: ProfileRow | undefined): string {
  if (!p) return 'Seller';
  return getSellerName({
    owner_name: null,
    profiles: {
      first_name: p.first_name,
      last_name: p.last_name,
      full_name: p.full_name,
      company_name: p.company_name,
    },
  });
}

function initialsOf(name: string): string {
  return name.split(/\s+/).map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '?';
}

export async function GET(req: NextRequest) {
  if (!(await checkIsAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const service = createServiceClient();

  // ── Source of truth: the messages table itself (NOT conversations.last_message_*) ──
  // Pull every message, most-recent first, and aggregate per conversation. This keeps
  // the list accurate even when the conversations preview cache was never updated.
  const { data: msgs, error: msgErr } = await service
    .from('messages')
    .select('id, conversation_id, sender_id, body, is_read, created_at')
    .not('conversation_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  const messages = msgs ?? [];

  type Agg = {
    conversation_id: string;
    last_body: string;
    last_at: string;
    last_sender_id: string | null;
    message_count: number;
    unread_count: number;
    sender_ids: Set<string>;
  };
  const aggByConv = new Map<string, Agg>();
  for (const m of messages) {
    const cid = m.conversation_id as string;
    let a = aggByConv.get(cid);
    if (!a) {
      // messages are ordered created_at DESC, so the first one seen is the latest.
      a = {
        conversation_id: cid,
        last_body: m.body ?? '',
        last_at: m.created_at,
        last_sender_id: m.sender_id ?? null,
        message_count: 0,
        unread_count: 0,
        sender_ids: new Set<string>(),
      };
      aggByConv.set(cid, a);
    }
    a.message_count += 1;
    if (m.is_read === false) a.unread_count += 1;
    if (m.sender_id) a.sender_ids.add(m.sender_id);
  }

  const convIds = [...aggByConv.keys()];

  // Join conversations for participant + listing metadata (may be missing for orphans).
  const { data: convRows } = convIds.length
    ? await service
        .from('conversations')
        .select('id, buyer_id, seller_id, listing_id, subject, status')
        .in('id', convIds)
    : { data: [] };
  const convMap = new Map<string, { id: string; buyer_id: string | null; seller_id: string | null; listing_id: string | null; subject: string | null; status: string | null }>();
  for (const c of convRows ?? []) convMap.set(c.id, c);

  // Collect all participant ids (from conversations + message senders for orphans).
  const userIds = new Set<string>();
  for (const c of convRows ?? []) { if (c.buyer_id) userIds.add(c.buyer_id); if (c.seller_id) userIds.add(c.seller_id); }
  for (const a of aggByConv.values()) for (const s of a.sender_ids) userIds.add(s);

  const { data: profRows } = userIds.size
    ? await service
        .from('profiles')
        .select('id, first_name, last_name, full_name, company_name, email')
        .in('id', [...userIds])
    : { data: [] };
  const profMap = new Map<string, ProfileRow>();
  for (const p of profRows ?? []) profMap.set(p.id, p as ProfileRow);

  const listingIds = [...new Set((convRows ?? []).map(c => c.listing_id).filter((x): x is string => !!x))];
  const { data: listingRows } = listingIds.length
    ? await service
        .from('listings')
        .select('id, title, street_address, county, state')
        .in('id', listingIds)
    : { data: [] };
  const listingMap = new Map<string, { id: string; title: string | null; street_address: string | null; county: string | null; state: string | null }>();
  for (const l of listingRows ?? []) listingMap.set(l.id, l);

  const conversations = [...aggByConv.values()].map(a => {
    const conv = convMap.get(a.conversation_id);
    const buyerProfile = conv?.buyer_id ? profMap.get(conv.buyer_id) : undefined;
    const sellerProfile = conv?.seller_id ? profMap.get(conv.seller_id) : undefined;

    const buyerName = buyerDisplay(buyerProfile);
    const sellerName = sellerDisplay(sellerProfile);
    const listing = conv?.listing_id ? (listingMap.get(conv.listing_id) ?? null) : null;

    return {
      id: a.conversation_id,
      buyer_id: conv?.buyer_id ?? null,
      seller_id: conv?.seller_id ?? null,
      listing_id: conv?.listing_id ?? null,
      subject: conv?.subject ?? null,
      status: conv?.status ?? null,
      buyer: {
        id: conv?.buyer_id ?? null,
        name: buyerName,
        email: buyerProfile?.email ?? null,
        initials: initialsOf(buyerName),
      },
      seller: {
        id: conv?.seller_id ?? null,
        name: sellerName,
        email: sellerProfile?.email ?? null,
        initials: initialsOf(sellerName),
      },
      listing: listing
        ? { id: listing.id, title: listing.title, street_address: listing.street_address, county: listing.county, state: listing.state }
        : null,
      // Derived straight from the messages table — never from the preview cache.
      last_message_preview: a.last_body.length > 120 ? a.last_body.slice(0, 120) + '…' : a.last_body,
      last_activity_at: a.last_at,
      message_count: a.message_count,
      unread_count: a.unread_count,
      orphan: !conv, // message(s) exist but no conversations row
    };
  });

  // Most recent activity first (from actual message timestamps).
  conversations.sort((x, y) => (y.last_activity_at ?? '').localeCompare(x.last_activity_at ?? ''));

  // Accuracy totals — the admin view surfaces these so they can be checked against
  // SELECT count(*) FROM messages / count(distinct conversation_id) FROM messages.
  const totals = {
    total_conversations: conversations.length,
    total_messages: messages.length,
    unread_messages: messages.filter(m => m.is_read === false).length,
  };

  return NextResponse.json({ conversations, totals });
}
