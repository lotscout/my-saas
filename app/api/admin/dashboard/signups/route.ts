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

  const [profilesRes, subsRes, reportUsersRes] = await Promise.all([
    service
      .from('profiles')
      .select('id, email, first_name, last_name, full_name, state, created_at, updated_at, is_test_profile, is_admin')
      .order('created_at', { ascending: false }),
    service
      .from('subscriptions')
      .select('user_id, tier, created_at')
      .eq('status', 'active'),
    service
      .from('property_analysis_requests')
      .select('user_id'),
  ]);

  // Try to fetch signup_source separately — column may not exist yet
  const sourcesRes = await service
    .from('profiles')
    .select('id, signup_source')
    .not('is_test_profile', 'is', null);

  const allProfiles = (profilesRes.data ?? []).filter(p => !p.is_test_profile);

  // Build tier + sub date lookup
  const subByUser: Record<string, { tier: string; created_at: string }> = {};
  for (const s of (subsRes.data ?? [])) {
    subByUser[s.user_id] = { tier: s.tier, created_at: s.created_at };
  }

  // Enrich profiles with tier and sub_created_at
  const profiles = allProfiles.map(p => ({
    ...p,
    subscription_tier: subByUser[p.id]?.tier ?? 'free',
    sub_created_at:    subByUser[p.id]?.created_at ?? null,
  }));

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const now = new Date();

  const weekCutoff  = new Date(now); weekCutoff.setDate(now.getDate() - 7);   weekCutoff.setHours(0, 0, 0, 0);
  const monthCutoff = new Date(now); monthCutoff.setDate(now.getDate() - 30); monthCutoff.setHours(0, 0, 0, 0);

  const thisWeekSignups  = profiles.filter(p => new Date(p.created_at) >= weekCutoff).length;
  const thisMonthSignups = profiles.filter(p => new Date(p.created_at) >= monthCutoff).length;

  const paidProfiles  = profiles.filter(p => p.subscription_tier !== 'free');
  const freeToPaidRate = profiles.length > 0
    ? Math.round((paidProfiles.length / profiles.length) * 1000) / 10
    : 0;

  const converters = paidProfiles.filter(p => p.sub_created_at);
  let avgDaysToPaid: number | null = null;
  if (converters.length > 0) {
    const totalDays = converters.reduce((sum, p) => {
      const diff = new Date(p.sub_created_at!).getTime() - new Date(p.created_at).getTime();
      return sum + Math.max(0, diff / 86400000);
    }, 0);
    avgDaysToPaid = Math.round(totalDays / converters.length);
  }

  // ── Weekly trend (last 8 weeks) ───────────────────────────────────────────

  const weeklyData = Array.from({ length: 8 }, (_, idx) => {
    const weeksBack = 7 - idx;
    const wkEnd = new Date(now);
    wkEnd.setDate(now.getDate() - weeksBack * 7);
    wkEnd.setHours(23, 59, 59, 999);
    const wkStart = new Date(wkEnd);
    wkStart.setDate(wkEnd.getDate() - 6);
    wkStart.setHours(0, 0, 0, 0);

    const week = profiles.filter(p => {
      const d = new Date(p.created_at);
      return d >= wkStart && d <= wkEnd;
    });

    return {
      week:  `Wk${idx + 1}`,
      total: week.length,
      paid:  week.filter(p => p.subscription_tier !== 'free').length,
    };
  });

  // ── Source counts (graceful if column missing) ────────────────────────────

  const sourceCounts: Record<string, number> = {};
  const sourceColumnExists = !sourcesRes.error;
  if (sourceColumnExists && sourcesRes.data) {
    // Build a lookup by id for non-test profiles
    const testIds = new Set((profilesRes.data ?? []).filter(p => p.is_test_profile).map(p => p.id));
    for (const row of sourcesRes.data) {
      if (testIds.has(row.id)) continue;
      const src = (row.signup_source as string | null) || 'Unknown';
      sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
    }
  }

  // ── Report user count ─────────────────────────────────────────────────────

  const uniqueReportUsers = new Set((reportUsersRes.data ?? []).map(r => r.user_id)).size;

  return NextResponse.json({
    kpis: { thisWeekSignups, thisMonthSignups, freeToPaidRate, avgDaysToPaid },
    weeklyData,
    sourceCounts,
    sourceColumnExists,
    reportUserCount: uniqueReportUsers,
    profiles,
  });
}
