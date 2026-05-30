import { NextRequest, NextResponse } from 'next/server';
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

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const service = createServiceClient();
  const now = new Date();

  const [adSpendRes, emailSubsRes, linkedinRes, paymentsRes] = await Promise.all([
    service
      .from('ad_spend')
      .select('id, date, channel, campaign_name, spend, leads, conversions, notes, created_at')
      .order('date', { ascending: false }),
    service
      .from('email_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    service
      .from('linkedin_outreach')
      .select('stage'),
    service
      .from('admin_payments_log')
      .select('amount'),
  ]);

  // ── Totals from ad_spend ───────────────────────────────────────────────────

  const adSpendData = adSpendRes.data ?? [];
  const totalSpend = adSpendData.reduce((s, r) => s + Number(r.spend), 0);
  const totalLeads = adSpendData.reduce((s, r) => s + Number(r.leads), 0);
  const totalConversions = adSpendData.reduce((s, r) => s + Number(r.conversions), 0);
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

  // ── Email subscribers ──────────────────────────────────────────────────────

  const emailSubscribers = emailSubsRes.error ? 0 : (emailSubsRes.count ?? 0);

  // ── Weekly spend + leads (last 4 weeks) ───────────────────────────────────

  const weeklySpend: { week: string; meta: number; linkedin: number; other: number }[] = [];
  const weeklyLeads: { week: string; meta: number; linkedin: number; other: number }[] = [];

  for (let i = 3; i >= 0; i--) {
    const wkEnd = new Date(now);
    wkEnd.setDate(now.getDate() - i * 7);
    wkEnd.setHours(23, 59, 59, 999);
    const wkStart = new Date(wkEnd);
    wkStart.setDate(wkEnd.getDate() - 6);
    wkStart.setHours(0, 0, 0, 0);

    const label = `Wk${4 - i}`;
    const spend = { week: label, meta: 0, linkedin: 0, other: 0 };
    const leads = { week: label, meta: 0, linkedin: 0, other: 0 };

    for (const row of adSpendData) {
      const d = new Date(row.date);
      if (d < wkStart || d > wkEnd) continue;
      const ch = row.channel === 'meta' ? 'meta' : row.channel === 'linkedin' ? 'linkedin' : 'other';
      spend[ch] += Number(row.spend);
      leads[ch] += Number(row.leads);
    }
    weeklySpend.push(spend);
    weeklyLeads.push(leads);
  }

  // ── LinkedIn outreach pipeline ────────────────────────────────────────────

  const PIPELINE_STAGES = ['connected', 'value_sent', 'pitched', 'replied', 'converted'];
  const stageCounts: Record<string, number> = {};
  for (const s of PIPELINE_STAGES) stageCounts[s] = 0;
  for (const row of (linkedinRes.data ?? [])) {
    if (row.stage in stageCounts) stageCounts[row.stage]++;
  }
  const linkedinPipeline = PIPELINE_STAGES.map(stage => ({ stage, count: stageCounts[stage] }));

  // ── Email funnel ──────────────────────────────────────────────────────────

  // TODO: hook Opened / Clicked / Converted into ConvertKit API
  const emailFunnel = [
    { stage: 'Sent',      count: emailSubscribers },
    { stage: 'Opened',    count: 0 },
    { stage: 'Clicked',   count: 0 },
    { stage: 'Converted', count: 0 },
  ];

  // ── ROAS metrics ──────────────────────────────────────────────────────────

  const paymentsData = paymentsRes.error ? [] : (paymentsRes.data ?? []);
  const totalRevenue = paymentsData.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const avgPlanValue = paymentsData.length > 0 ? totalRevenue / paymentsData.length : 0;

  const roas           = totalSpend > 0 && totalRevenue > 0 ? totalRevenue / totalSpend : 0;
  const cpa            = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const paybackMonths  = cpa > 0 && avgPlanValue > 0 ? cpa / avgPlanValue : null;
  const ltvCacRatio    = cpa > 0 && avgPlanValue > 0 ? (avgPlanValue * 6) / cpa : null;

  // ── Last 5 ad_spend entries (already sorted desc) ─────────────────────────

  const lastEntries = adSpendData.slice(0, 5);

  return NextResponse.json({
    totals: { spend: totalSpend, leads: totalLeads, conversions: totalConversions, cpl },
    emailSubscribers,
    weeklySpend,
    weeklyLeads,
    emailFunnel,
    linkedinPipeline,
    roas: { totalRevenue, roas, cpa, paybackMonths, ltvCacRatio, avgPlanValue },
    lastEntries,
    tablesReady: {
      adSpend:          !adSpendRes.error,
      emailSubscribers: !emailSubsRes.error,
      linkedinOutreach: !linkedinRes.error,
      paymentsLog:      !paymentsRes.error,
    },
  });
}

// ─── POST — add ad_spend entry ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const { date, channel, campaign_name, spend, leads, conversions, notes } = body;

  if (!date || !channel || spend == null) {
    return NextResponse.json({ error: 'date, channel, and spend are required' }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from('ad_spend')
    .insert({ date, channel, campaign_name: campaign_name || null, spend, leads: leads ?? 0, conversions: conversions ?? 0, notes: notes || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}
