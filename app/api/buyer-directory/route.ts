import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import { resolveStateQuery } from '@/lib/stateMap';

export async function GET(request: NextRequest) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'active';
  const state = searchParams.get('state');
  const timeline = searchParams.get('timeline');
  const limit = parseInt(searchParams.get('limit') ?? '200');

  const service = createServiceClient();

  let query = service
    .from('buyer_requests')
    .select('*, display_name, display_company, contact_phone, contact_phone_type, contact_email, contact_website')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (state) {
    const vals = resolveStateQuery(state);
    // Match either the full name or the abbreviation stored in target_state
    query = query.or(vals.map(v => `target_state.ilike.${v}`).join(','));
  }
  if (timeline) query = query.eq('timeline', timeline);

  const { data: requests, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!requests?.length) {
    return NextResponse.json({ requests: [] });
  }

  // Manually join profiles. Try to include contact_visible; fall back gracefully if the
  // column hasn't been migrated yet (older databases). Missing column => treated as private.
  const userIds = [...new Set(requests.map((r) => r.user_id).filter(Boolean))];
  const baseCols = 'id, first_name, last_name, company_name, avatar_url, is_test_profile, email, phone, website';
  let profiles: Array<Record<string, unknown>> | null = null;
  const withVisible = await service.from('profiles').select(`${baseCols}, contact_visible`).in('id', userIds);
  if (withVisible.error) {
    const fallback = await service.from('profiles').select(baseCols).in('id', userIds);
    profiles = fallback.data as Array<Record<string, unknown>> | null;
  } else {
    profiles = withVisible.data as Array<Record<string, unknown>> | null;
  }

  const profileMap: Record<string, Record<string, unknown>> = {};
  (profiles ?? []).forEach((p) => { profileMap[p.id as string] = p; });

  // Respect each buyer's contact visibility preference (default: private).
  const enriched = requests.map((r) => {
    const prof = profileMap[r.user_id] ?? null;
    const contactVisible = prof?.contact_visible === true;
    return {
      ...r,
      profiles: prof,
      contact_phone: contactVisible ? (r.contact_phone ?? prof?.phone ?? null) : null,
      contact_phone_type: contactVisible ? r.contact_phone_type : null,
      contact_email: contactVisible ? (r.contact_email ?? prof?.email ?? null) : null,
      contact_website: contactVisible ? (r.contact_website ?? prof?.website ?? null) : null,
    };
  });

  return NextResponse.json({ requests: enriched });
}
