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
  const todayISO = new Date().toISOString().split('T')[0];

  // All queries run in parallel; tables may not exist yet → check .error field
  const [
    activityTodayRes,
    signupsTodayRes,
    listingsTodayRes,
    paymentsTodayRes,
    feedRes,
  ] = await Promise.all([
    service
      .from('admin_activity_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO),
    service
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO)
      .eq('is_test_profile', false),
    service
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO),
    service
      .from('admin_payments_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO),
    service
      .from('admin_activity_log')
      .select('id, type, title, description, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    kpis: {
      eventsToday:   activityTodayRes.error  ? 0 : (activityTodayRes.count  ?? 0),
      signupsToday:  signupsTodayRes.error   ? 0 : (signupsTodayRes.count   ?? 0),
      listingsToday: listingsTodayRes.error  ? 0 : (listingsTodayRes.count  ?? 0),
      paymentsToday: paymentsTodayRes.error  ? 0 : (paymentsTodayRes.count  ?? 0),
    },
    feed: feedRes.error ? [] : (feedRes.data ?? []),
    tablesReady: !activityTodayRes.error,
  });
}
