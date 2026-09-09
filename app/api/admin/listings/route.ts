import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_STATUS = new Set(['all', 'pending_review', 'active', 'revision_needed', 'rejected']);

async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;

  const service = createServiceClient();
  const { data } = await service.from('profiles').select('is_admin').eq('id', user.id).single();
  return data?.is_admin === true;
}

function displayName(profile: any) {
  return profile?.full_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || null;
}

export async function GET(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get('status') || 'pending_review';
  const statusFilter = VALID_STATUS.has(status) ? status : 'pending_review';
  const service = createServiceClient();

  let listingsQuery = service
    .from('listings')
    .select('id, title, status, state, county, lot_size_acres, lot_size_sqft, asking_price, created_at, updated_at, user_id')
    .order('created_at', { ascending: false })
    .limit(100);

  if (statusFilter !== 'all') listingsQuery = listingsQuery.eq('status', statusFilter);

  const [{ data: listings, error: listingsError }, { data: buyerRequests, error: buyersError }] = await Promise.all([
    listingsQuery,
    service
      .from('buyer_requests')
      .select('id, status, target_regions, budget_min, budget_max, min_acreage, max_acreage, use_case, created_at, user_id')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false }),
  ]);

  if (listingsError) return NextResponse.json({ error: listingsError.message }, { status: 500 });
  if (buyersError) return NextResponse.json({ error: buyersError.message }, { status: 500 });

  const userIds = [...new Set([...(listings ?? []), ...(buyerRequests ?? [])].map((row: any) => row.user_id).filter(Boolean))];
  const { data: profiles, error: profilesError } = userIds.length
    ? await service.from('profiles').select('id, full_name, first_name, last_name, email').in('id', userIds)
    : { data: [], error: null };

  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });

  const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, {
    full_name: displayName(profile),
    email: profile.email ?? null,
  }]));

  return NextResponse.json({
    listings: (listings ?? []).map((listing: any) => ({
      ...listing,
      profiles: profileMap.get(listing.user_id) ?? null,
    })),
    pendingBuyers: (buyerRequests ?? []).map((buyer: any) => ({
      ...buyer,
      profiles: profileMap.get(buyer.user_id) ?? null,
    })),
  });
}
