import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail, ADMIN_EMAILS } from '@/lib/admin';

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

  const [
    { count: totalListings },
    { count: activeBuyerRequests },
    { count: totalReports },
    { data: completedReports },
    { data: listings },
    { data: subs },
    { data: buyerRequests },
    { data: profiles },
  ] = await Promise.all([
    service.from('listings').select('*', { count: 'exact', head: true }),
    service.from('buyer_requests').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    service.from('property_analysis_requests').select('*', { count: 'exact', head: true }),
    service
      .from('property_analysis_requests')
      .select('created_at, completed_at')
      .eq('status', 'completed')
      .not('completed_at', 'is', null),
    service
      .from('listings')
      .select('id, title, state, county, city, street_address, lot_size_acres, asking_price, status, photos_urls, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    service.from('subscriptions').select('user_id, tier').eq('status', 'active'),
    service
      .from('buyer_requests')
      .select('id, user_id, status, target_state, target_county, target_city, min_acreage, max_acreage, budget_min, budget_max, use_case, timeline, created_at')
      .order('created_at', { ascending: false }),
    service
      .from('profiles')
      .select('id, email, first_name, last_name, full_name, company_name'),
  ]);

  // Avg report delivery in minutes
  let avgDeliveryMinutes: number | null = null;
  if (completedReports && completedReports.length > 0) {
    const totalMs = completedReports.reduce((sum, r) => {
      const diff = new Date(r.completed_at).getTime() - new Date(r.created_at).getTime();
      return sum + (diff > 0 ? diff : 0);
    }, 0);
    avgDeliveryMinutes = Math.round(totalMs / completedReports.length / 60000);
  }

  // Build tier lookup by user_id
  const tierByUser: Record<string, string> = {};
  for (const s of subs ?? []) tierByUser[s.user_id] = s.tier;

  // Build profile lookup
  const profileById: Record<string, Record<string, unknown>> = {};
  for (const p of profiles ?? []) {
    profileById[p.id as string] = p as Record<string, unknown>;
  }

  // Enrich listings with tier + owner name
  const enrichedListings = (listings ?? []).map(l => {
    const tier = tierByUser[l.user_id as string] ?? 'free';
    const owner = profileById[l.user_id as string];
    const ownerName = owner
      ? ((owner.full_name as string) || [owner.first_name, owner.last_name].filter(Boolean).join(' ') || (owner.email as string) || '—')
      : '—';
    return { ...l, subscription_tier: tier, owner_name: ownerName, owner_id: l.user_id };
  });

  // Tier distribution for doughnut
  const tierDist = enrichedListings.reduce<Record<string, number>>((acc, l) => {
    const t = l.subscription_tier;
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  // Enrich buyer requests with submitter name
  const enrichedBuyerRequests = (buyerRequests ?? []).map(r => {
    const owner = profileById[r.user_id as string];
    const submitterName = owner
      ? ((owner.full_name as string) || [owner.first_name, owner.last_name].filter(Boolean).join(' ') || (owner.email as string) || '—')
      : '—';
    const submitterEmail = owner ? (owner.email as string) : null;
    return { ...r, submitter_name: submitterName, submitter_email: submitterEmail, submitter_id: r.user_id };
  });

  // Platform health
  const listingCount = totalListings ?? 0;
  const buyerCount = activeBuyerRequests ?? 0;
  const reportCount = totalReports ?? 0;
  const completedCount = completedReports?.length ?? 0;

  return NextResponse.json({
    kpis: {
      totalListings: listingCount,
      activeBuyerRequests: buyerCount,
      reportsGenerated: reportCount,
      avgDeliveryMinutes,
    },
    tierDistribution: tierDist,
    platformHealth: {
      avgViewsPerWeek: 0, // listing_views table not yet implemented
      buyerInquiryRate: listingCount > 0 ? Math.round((buyerCount / listingCount) * 100) : 0,
      reportCompletionRate: reportCount > 0 ? Math.round((completedCount / reportCount) * 100) : 0,
      uptimePercent: 99.9,
    },
    listings: enrichedListings,
    buyerRequests: enrichedBuyerRequests,
  });
}
