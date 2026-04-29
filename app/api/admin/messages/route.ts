import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const ADMIN_EMAILS = ['bobby@lotscout.com', 'bobby.r.oliver@gmail.com'];

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (ADMIN_EMAILS.includes(user.email ?? '')) return true;
  const service = createServiceClient();
  const { data } = await service.from('profiles').select('is_admin').eq('id', user.id).single();
  return data?.is_admin === true;
}

// GET /api/admin/messages?listing_id=X&sender_id=Y  → thread
// GET /api/admin/messages?listing_id=X              → all messages for listing
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const listing_id = searchParams.get('listing_id');
  const sender_id = searchParams.get('sender_id');

  if (!listing_id) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
  }

  const service = createServiceClient();

  let query = service
    .from('messages')
    .select('id, body, created_at, sender_id, recipient_id, listing_id')
    .eq('listing_id', listing_id)
    .order('created_at', { ascending: true });

  if (sender_id) {
    query = query.or(`sender_id.eq.${sender_id},recipient_id.eq.${sender_id}`);
  }

  const { data: messages, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!messages?.length) {
    return NextResponse.json({ messages: [] });
  }

  const userIds = [...new Set([
    ...messages.map(m => m.sender_id),
    ...messages.map(m => m.recipient_id),
  ].filter(Boolean))];

  const { data: profiles } = await service
    .from('profiles')
    .select('id, email, first_name, last_name, full_name')
    .in('id', userIds);

  const profileMap: Record<string, { name: string; email: string | null }> = {};
  (profiles ?? []).forEach((p: { id: string; email: string | null; first_name: string | null; last_name: string | null; full_name: string | null }) => {
    profileMap[p.id] = {
      name: p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown',
      email: p.email,
    };
  });

  const enriched = messages.map(m => ({
    ...m,
    sender: profileMap[m.sender_id] ?? { name: 'Unknown', email: null },
    recipient: profileMap[m.recipient_id] ?? { name: 'Unknown', email: null },
  }));

  return NextResponse.json({ messages: enriched });
}

// POST /api/admin/messages  → send message as impersonated user
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json() as {
    listing_id: string;
    sender_id: string;
    recipient_id: string;
    message: string;
  };

  const { listing_id, sender_id, recipient_id, message } = body;

  if (!listing_id || !sender_id || !recipient_id || !message?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const service = createServiceClient();

  const { error } = await service.from('messages').insert({
    listing_id,
    sender_id,
    recipient_id,
    body: message.trim(),
    created_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
