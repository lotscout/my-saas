import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'active';
  const state = searchParams.get('state');
  const timeline = searchParams.get('timeline');
  const limit = parseInt(searchParams.get('limit') ?? '200');

  const service = createServiceClient();

  let query = service
    .from('buyer_requests')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (state) query = query.ilike('target_state', state);
  if (timeline) query = query.eq('timeline', timeline);

  const { data: requests, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!requests?.length) {
    return NextResponse.json({ requests: [] });
  }

  // Manually join profiles
  const userIds = [...new Set(requests.map((r) => r.user_id).filter(Boolean))];
  const { data: profiles } = await service
    .from('profiles')
    .select('id, first_name, last_name, company_name, avatar_url')
    .in('id', userIds);

  const profileMap: Record<string, { first_name: string | null; last_name: string | null; company_name: string | null; avatar_url: string | null }> = {};
  (profiles ?? []).forEach((p) => { profileMap[p.id] = p; });

  const enriched = requests.map((r) => ({
    ...r,
    profiles: profileMap[r.user_id] ?? null,
  }));

  return NextResponse.json({ requests: enriched });
}
