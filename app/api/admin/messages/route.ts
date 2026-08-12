import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  const service = createServiceClient();
  const { data } = await service.from('profiles').select('*').eq('id', user.id).single();
  return data?.is_admin === true;
}

type NameEmail = { name: string; email: string | null };

function resolveNames(
  profiles: { id: string; email: string | null; first_name: string | null; last_name: string | null; full_name: string | null }[] | null
): Record<string, NameEmail> {
  const map: Record<string, NameEmail> = {};
  for (const p of profiles ?? []) {
    map[p.id] = {
      name: p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown',
      email: p.email,
    };
  }
  return map;
}

// Find the conversation for a (test buyer, listing owner) pair. The production messages
// table has no listing_id/recipient_id — threads are keyed by conversation, so we resolve
// the listing's owner and match the buyer/seller pair (either direction).
async function findConversationId(
  service: ReturnType<typeof createServiceClient>,
  listingId: string,
  buyerId: string
): Promise<{ conversationId: string | null; sellerId: string | null }> {
  const { data: listing } = await service
    .from('listings')
    .select('user_id')
    .eq('id', listingId)
    .maybeSingle();
  const sellerId = listing?.user_id ?? null;
  if (!sellerId) return { conversationId: null, sellerId: null };

  const { data: conv } = await service
    .from('conversations')
    .select('id')
    .or(
      `and(buyer_id.eq.${buyerId},seller_id.eq.${sellerId}),` +
      `and(buyer_id.eq.${sellerId},seller_id.eq.${buyerId})`
    )
    .limit(1)
    .maybeSingle();

  return { conversationId: conv?.id ?? null, sellerId };
}

// GET /api/admin/messages?listing_id=X&sender_id=Y → thread between test buyer Y and the
// owner of listing X. Returns the same shape the Buyer Messaging page expects.
export async function GET(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const listing_id = searchParams.get('listing_id');
  const sender_id = searchParams.get('sender_id');

  if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
  if (!sender_id) return NextResponse.json({ messages: [] });

  const service = createServiceClient();

  const { conversationId, sellerId } = await findConversationId(service, listing_id, sender_id);
  if (!conversationId) return NextResponse.json({ messages: [] });

  const { data: messages, error } = await service
    .from('messages')
    .select('id, body, created_at, sender_id')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!messages?.length) return NextResponse.json({ messages: [] });

  const userIds = [...new Set(messages.map(m => m.sender_id).filter((x): x is string => !!x))];
  const { data: profiles } = await service
    .from('profiles')
    .select('id, email, first_name, last_name, full_name')
    .in('id', userIds);
  const nameMap = resolveNames(profiles);

  // Synthesize recipient_id (the other participant) for each message so the page's
  // existing rendering keeps working without changes.
  const enriched = messages.map(m => {
    const recipient_id = m.sender_id === sender_id ? sellerId : sender_id;
    return {
      id: m.id,
      body: m.body,
      created_at: m.created_at,
      sender_id: m.sender_id,
      recipient_id,
      sender: nameMap[m.sender_id ?? ''] ?? { name: 'Unknown', email: null },
      recipient: (recipient_id ? nameMap[recipient_id] : null) ?? { name: 'Unknown', email: null },
    };
  });

  return NextResponse.json({ messages: enriched });
}

// POST /api/admin/messages  { listing_id, sender_id, recipient_id, message }
// Sends a message AS the test buyer (sender_id) to the listing owner (recipient_id),
// finding or creating the conversation. Uses only columns that exist in production.
export async function POST(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { listing_id, sender_id, recipient_id, message } = (await request.json()) as {
    listing_id: string; sender_id: string; recipient_id: string; message: string;
  };

  if (!listing_id || !sender_id || !recipient_id || !message?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const service = createServiceClient();

  // Find or create the conversation (buyer = test profile, seller = listing owner).
  let conversationId: string | null = null;
  const { data: existing } = await service
    .from('conversations')
    .select('id')
    .or(
      `and(buyer_id.eq.${sender_id},seller_id.eq.${recipient_id}),` +
      `and(buyer_id.eq.${recipient_id},seller_id.eq.${sender_id})`
    )
    .limit(1)
    .maybeSingle();
  conversationId = existing?.id ?? null;

  if (!conversationId) {
    const { data: newConv, error: convErr } = await service
      .from('conversations')
      .insert({ buyer_id: sender_id, seller_id: recipient_id, listing_id, status: 'active' })
      .select('id')
      .single();
    if (convErr || !newConv) {
      return NextResponse.json({ error: convErr?.message ?? 'Failed to create conversation' }, { status: 500 });
    }
    conversationId = newConv.id;
  }

  const trimmed = message.trim();
  const { data: inserted, error } = await service
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id, body: trimmed })
    .select('id, created_at')
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message ?? 'Failed to send message' }, { status: 500 });
  }

  // Keep the conversation preview cache warm (best-effort).
  const preview = trimmed.length > 120 ? trimmed.slice(0, 120) + '…' : trimmed;
  service
    .from('conversations')
    .update({ last_message_at: inserted.created_at, last_message_preview: preview })
    .eq('id', conversationId)
    .then(({ error: e }) => { if (e) console.warn('[admin/messages] preview update failed:', e); });

  return NextResponse.json({ success: true, conversationId });
}
