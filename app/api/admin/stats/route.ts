import { NextResponse } from 'next/server';
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

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const service = createServiceClient();

  const [
    { count: totalUsers },
    { count: activeListings },
    { count: pendingListings },
    { count: pendingAnalysis },
    { count: pendingBuyerRequests },
  ] = await Promise.all([
    service.from('profiles').select('*', { count: 'exact', head: true }),
    service.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    service.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    service.from('property_analysis_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    service.from('buyer_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
  ]);

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    activeListings: activeListings ?? 0,
    pendingListings: pendingListings ?? 0,
    pendingAnalysis: pendingAnalysis ?? 0,
    pendingBuyerRequests: pendingBuyerRequests ?? 0,
  });
}
