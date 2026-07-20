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

  const [
    { count: totalUsers },
    { count: activeListings },
    { count: pendingListings },
    { count: pendingAnalysis },
    { count: pendingBuyerRequests },
    { count: totalListings },
    { count: totalBuyerRequests },
  ] = await Promise.all([
    service.from('profiles').select('*', { count: 'exact', head: true }),
    service.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    service.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    service.from('property_analysis_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    service.from('buyer_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    service.from('listings').select('*', { count: 'exact', head: true }),
    service.from('buyer_requests').select('*', { count: 'exact', head: true }),
  ]);

  const [{ data: recentListings }, { data: recentBuyerRequests }] = await Promise.all([
    service.from('listings').select('id, address, city, state, price, status, created_at').order('created_at', { ascending: false }).limit(10),
    service.from('buyer_requests').select('id, first_name, last_name, company_name, state, created_at, status').order('created_at', { ascending: false }).limit(10),
  ]);

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    activeListings: activeListings ?? 0,
    pendingListings: pendingListings ?? 0,
    pendingAnalysis: pendingAnalysis ?? 0,
    pendingBuyerRequests: pendingBuyerRequests ?? 0,
    totalListings: totalListings ?? 0,
    totalBuyerRequests: totalBuyerRequests ?? 0,
    recentListings: recentListings ?? [],
    recentBuyerRequests: recentBuyerRequests ?? [],
  });
}
