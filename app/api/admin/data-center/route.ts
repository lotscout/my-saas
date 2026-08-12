import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type CountResult = { count: number | null; error: any };

async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  const service = createServiceClient();
  const { data } = await service.from('profiles').select('is_admin').eq('id', user.id).single();
  return data?.is_admin === true;
}

function countValue(r: CountResult) {
  return r.error ? null : (r.count ?? 0);
}

function moneyFromCents(cents: number) {
  return Math.round(cents) / 100;
}

function short(text: unknown, len = 120) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  return value.length > len ? `${value.slice(0, len - 1)}…` : value;
}

function fullName(row: any) {
  return row?.full_name || [row?.first_name, row?.last_name].filter(Boolean).join(' ') || row?.email || 'Unknown';
}

export async function GET() {
  if (!(await checkIsAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const service = createServiceClient();
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 3600 * 1000).toISOString();
  const weekAgo = new Date(now - 7 * 24 * 3600 * 1000).toISOString();
  const monthAgo = new Date(now - 30 * 24 * 3600 * 1000).toISOString();

  const [
    usersTotal, users24h, users7d, users30d,
    paidProfiles, searchProfiles, activeSubs, canceledSubs,
    listingsTotal, activeListings, pendingListings, deletedListings, soldListings, promotedListings,
    buyerTotal, activeBuyers, pendingBuyers,
    messagesTotal, conversationsTotal, unreadMessages,
    scoutQuestions, scout7d, scoutToday, searchUsageRows,
    analysisTotal, pendingAnalysis, marketReportsTotal, emailsTotal, emails7d,
  ] = await Promise.all([
    service.from('profiles').select('*', { count: 'exact', head: true }),
    service.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', dayAgo),
    service.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    service.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo),
    service.from('profiles').select('*', { count: 'exact', head: true }).in('subscription_tier', ['standard', 'priority', 'exclusive']),
    service.from('profiles').select('*', { count: 'exact', head: true }).eq('has_search_pro', true),
    service.from('subscriptions').select('*', { count: 'exact', head: true }).in('status', ['active', 'trialing']),
    service.from('subscriptions').select('*', { count: 'exact', head: true }).in('status', ['canceled', 'unpaid', 'past_due']),
    service.from('listings').select('*', { count: 'exact', head: true }),
    service.from('listings').select('*', { count: 'exact', head: true }).in('status', ['active', 'published']),
    service.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    service.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'deleted'),
    service.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
    service.from('listings').select('*', { count: 'exact', head: true }).eq('promoted', true),
    service.from('buyer_requests').select('*', { count: 'exact', head: true }),
    service.from('buyer_requests').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    service.from('buyer_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    service.from('messages').select('*', { count: 'exact', head: true }),
    service.from('conversations').select('*', { count: 'exact', head: true }),
    service.from('messages').select('*', { count: 'exact', head: true }).eq('is_read', false),
    service.from('advisor_conversations').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    service.from('advisor_conversations').select('*', { count: 'exact', head: true }).eq('role', 'user').gte('created_at', weekAgo),
    service.from('advisor_conversations').select('*', { count: 'exact', head: true }).eq('role', 'user').gte('created_at', dayAgo),
    service.from('search_usage').select('user_id, usage_date, count').order('usage_date', { ascending: false }).limit(100),
    service.from('property_analysis_requests').select('*', { count: 'exact', head: true }),
    service.from('property_analysis_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    service.from('market_report_requests').select('*', { count: 'exact', head: true }),
    service.from('email_logs').select('*', { count: 'exact', head: true }),
    service.from('email_logs').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
  ]);

  const [
    { data: users }, { data: subscriptions }, { data: listings }, { data: buyerRequests },
    { data: messages }, { data: scout }, { data: analyses }, { data: marketReports }, { data: emails },
  ] = await Promise.all([
    service.from('profiles').select('id,email,full_name,first_name,last_name,company_name,role,subscription_tier,has_search_pro,is_admin,is_test_profile,state,county,signup_source,created_at,updated_at').order('created_at', { ascending: false }).limit(25),
    service.from('subscriptions').select('id,user_id,tier,status,stripe_price_id,current_period_start,current_period_end,cancel_at_period_end,cancelled_at,created_at,updated_at').order('updated_at', { ascending: false }).limit(25),
    service.from('listings').select('id,user_id,title,owner_name,status,state,county,city,asking_price,lot_size_acres,promoted,view_count,created_at,updated_at').order('created_at', { ascending: false }).limit(25),
    service.from('buyer_requests').select('id,user_id,display_name,display_company,status,target_city,target_county,target_state,state,budget_min,budget_max,timeline,view_count,created_at').order('created_at', { ascending: false }).limit(25),
    service.from('messages').select('id,conversation_id,sender_id,body,is_read,created_at').order('created_at', { ascending: false }).limit(25),
    service.from('advisor_conversations').select('id,user_id,role,content,created_at').eq('role', 'user').order('created_at', { ascending: false }).limit(25),
    service.from('property_analysis_requests').select('id,user_id,user_name,user_email,street_address,city,county,state,status,submitted_at,completed_at').order('submitted_at', { ascending: false }).limit(20),
    service.from('market_report_requests').select('id,email,first_name,last_name,county,state,status,is_paid,report_frequency,created_at').order('created_at', { ascending: false }).limit(20),
    service.from('email_logs').select('id,user_id,to_email,from_email,subject,email_type,status,created_at').order('created_at', { ascending: false }).limit(30),
  ]);

  const profileIds = new Set<string>();
  for (const row of [...(subscriptions ?? []), ...(listings ?? []), ...(buyerRequests ?? []), ...(messages ?? []), ...(scout ?? []), ...(analyses ?? []), ...(emails ?? [])]) {
    if ((row as any).user_id) profileIds.add((row as any).user_id);
    if ((row as any).sender_id) profileIds.add((row as any).sender_id);
  }
  const { data: relatedProfiles } = profileIds.size
    ? await service.from('profiles').select('id,email,full_name,first_name,last_name,company_name').in('id', [...profileIds])
    : { data: [] };
  const profileMap = new Map((relatedProfiles ?? []).map((p: any) => [p.id, p]));

  const subscriptionRows = (subscriptions ?? []).map((s: any) => ({
    id: s.id,
    user: fullName(profileMap.get(s.user_id)),
    email: profileMap.get(s.user_id)?.email ?? null,
    tier: s.tier,
    status: s.status,
    price_id: s.stripe_price_id,
    period_end: s.current_period_end,
    cancel_at_period_end: !!s.cancel_at_period_end,
    updated_at: s.updated_at,
  }));

  const monthlyCentsByTier: Record<string, number> = { standard: 12900, priority: 24900, exclusive: 59900, search_pro: 2000 };
  const revenue = {
    activeSubscriptions: countValue(activeSubs),
    canceledSubscriptions: countValue(canceledSubs),
    estimatedMonthlyRecurring: moneyFromCents(subscriptionRows
      .filter((s) => ['active', 'trialing'].includes(s.status))
      .reduce((sum, s) => sum + (monthlyCentsByTier[s.tier] ?? 0), 0)),
  };

  const tableHealthSource = [
    ['profiles', usersTotal], ['subscriptions', activeSubs], ['listings', listingsTotal], ['buyer_requests', buyerTotal],
    ['messages', messagesTotal], ['conversations', conversationsTotal], ['advisor_conversations', scoutQuestions],
    ['search_usage', searchUsageRows], ['property_analysis_requests', analysisTotal], ['market_report_requests', marketReportsTotal], ['email_logs', emailsTotal],
  ] as const;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    kpis: {
      users: { total: countValue(usersTotal), new24h: countValue(users24h), new7d: countValue(users7d), new30d: countValue(users30d), paidProfiles: countValue(paidProfiles), searchOnly: countValue(searchProfiles) },
      revenue,
      marketplace: { listings: countValue(listingsTotal), active: countValue(activeListings), pending: countValue(pendingListings), deleted: countValue(deletedListings), sold: countValue(soldListings), promoted: countValue(promotedListings) },
      buyers: { total: countValue(buyerTotal), active: countValue(activeBuyers), pending: countValue(pendingBuyers) },
      messaging: { messages: countValue(messagesTotal), conversations: countValue(conversationsTotal), unread: countValue(unreadMessages) },
      scout: { questions: countValue(scoutQuestions), questions7d: countValue(scout7d), questions24h: countValue(scoutToday), limitedUsersTracked: searchUsageRows.error ? null : (searchUsageRows.data ?? []).length },
      operations: { propertyAnalysis: countValue(analysisTotal), pendingAnalysis: countValue(pendingAnalysis), marketReports: countValue(marketReportsTotal), emails: countValue(emailsTotal), emails7d: countValue(emails7d) },
    },
    sections: {
      users: (users ?? []).map((u: any) => ({ id: u.id, name: fullName(u), email: u.email, company: u.company_name, role: u.role, tier: u.subscription_tier, search: !!u.has_search_pro, admin: !!u.is_admin, test: !!u.is_test_profile, location: [u.county, u.state].filter(Boolean).join(', '), source: u.signup_source, created_at: u.created_at })),
      subscriptions: subscriptionRows,
      listings: (listings ?? []).map((l: any) => ({ id: l.id, title: l.title || 'Untitled', seller: l.owner_name || fullName(profileMap.get(l.user_id)), status: l.status, location: [l.city, l.county, l.state].filter(Boolean).join(', '), price: l.asking_price, acres: l.lot_size_acres, promoted: !!l.promoted, views: l.view_count ?? 0, created_at: l.created_at })),
      buyerRequests: (buyerRequests ?? []).map((b: any) => ({ id: b.id, buyer: b.display_name || b.display_company || fullName(profileMap.get(b.user_id)), status: b.status, location: [b.target_city, b.target_county, b.target_state || b.state].filter(Boolean).join(', '), budget: [b.budget_min, b.budget_max], timeline: b.timeline, views: b.view_count ?? 0, created_at: b.created_at })),
      messages: (messages ?? []).map((m: any) => ({ id: m.id, sender: fullName(profileMap.get(m.sender_id)), conversation_id: m.conversation_id, preview: short(m.body, 120), read: !!m.is_read, created_at: m.created_at })),
      scout: (scout ?? []).map((s: any) => ({ id: s.id, user: fullName(profileMap.get(s.user_id)), email: profileMap.get(s.user_id)?.email ?? null, question: short(s.content, 160), created_at: s.created_at })),
      analyses: (analyses ?? []).map((a: any) => ({ id: a.id, user: a.user_name || fullName(profileMap.get(a.user_id)), email: a.user_email || profileMap.get(a.user_id)?.email || null, location: [a.street_address, a.city, a.county, a.state].filter(Boolean).join(', '), status: a.status, created_at: a.submitted_at, completed_at: a.completed_at })),
      marketReports: (marketReports ?? []).map((m: any) => ({ id: m.id, name: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email, email: m.email, location: [m.county, m.state].filter(Boolean).join(', '), status: m.status, paid: !!m.is_paid, frequency: m.report_frequency, created_at: m.created_at })),
      emails: (emails ?? []).map((e: any) => ({ id: e.id, to: e.to_email, subject: e.subject, type: e.email_type, status: e.status, created_at: e.created_at })),
      searchUsage: (searchUsageRows.data ?? []).map((u: any) => ({ user_id: u.user_id, date: u.usage_date, count: u.count })),
      tableHealth: tableHealthSource.map(([name, result]) => ({ table: name, count: result.error ? null : result.count, ok: !result.error, error: result.error?.message ?? null })),
    },
  });
}
