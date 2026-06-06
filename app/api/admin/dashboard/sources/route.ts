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
  const { data } = await service.from('profiles').select('is_admin').eq('id', user.id).single();
  return data?.is_admin === true;
}

export async function GET() {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const service = createServiceClient();

  const { data: rows, error } = await service
    .from('profiles')
    .select('signup_source, signup_medium, signup_campaign, created_at')
    .eq('is_test_profile', false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profiles = rows ?? [];
  const total = profiles.length;

  // ── By source ─────────────────────────────────────────────────────────────

  const sourceCounts: Record<string, number> = {};
  for (const p of profiles) {
    const src = p.signup_source || 'direct';
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
  }
  const bySource = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({ source, count, pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0 }));

  // ── Full breakdown (source × medium × campaign) ───────────────────────────

  const breakdownMap: Record<string, { source: string; medium: string; campaign: string; count: number }> = {};
  for (const p of profiles) {
    const src = p.signup_source || 'direct';
    const med = p.signup_medium || '';
    const cam = p.signup_campaign || '';
    const key = `${src}||${med}||${cam}`;
    if (!breakdownMap[key]) {
      breakdownMap[key] = { source: src, medium: med, campaign: cam, count: 0 };
    }
    breakdownMap[key].count++;
  }
  const breakdown = Object.values(breakdownMap)
    .sort((a, b) => b.count - a.count)
    .map(row => ({ ...row, pct: total > 0 ? Math.round((row.count / total) * 1000) / 10 : 0 }));

  // ── Weekly trend (last 8 weeks) by source ────────────────────────────────

  const now = new Date();
  const weeklyTrend = Array.from({ length: 8 }, (_, idx) => {
    const weeksBack = 7 - idx;
    const wkEnd = new Date(now);
    wkEnd.setDate(now.getDate() - weeksBack * 7);
    wkEnd.setHours(23, 59, 59, 999);
    const wkStart = new Date(wkEnd);
    wkStart.setDate(wkEnd.getDate() - 6);
    wkStart.setHours(0, 0, 0, 0);

    const weekProfiles = profiles.filter(p => {
      const d = new Date(p.created_at);
      return d >= wkStart && d <= wkEnd;
    });

    const tracked   = weekProfiles.filter(p => p.signup_source).length;
    const untracked = weekProfiles.length - tracked;
    return { week: `Wk${idx + 1}`, tracked, untracked, total: weekProfiles.length };
  });

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const weekCutoff  = new Date(now); weekCutoff.setDate(now.getDate() - 7);
  const monthCutoff = new Date(now); monthCutoff.setDate(now.getDate() - 30);

  const trackedTotal     = profiles.filter(p => p.signup_source).length;
  const uniqueSources    = Object.keys(sourceCounts).length;
  const thisWeekTracked  = profiles.filter(p => p.signup_source && new Date(p.created_at) >= weekCutoff).length;
  const thisMonthTracked = profiles.filter(p => p.signup_source && new Date(p.created_at) >= monthCutoff).length;

  return NextResponse.json({
    kpis: { total, trackedTotal, uniqueSources, thisWeekTracked, thisMonthTracked },
    bySource,
    breakdown,
    weeklyTrend,
  });
}
