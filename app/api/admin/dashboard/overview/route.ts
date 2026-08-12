import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';
import { getSellerName, isBadName } from '@/lib/getSellerName';
import { getBuyerName } from '@/lib/getBuyerName';

// This dashboard must always reflect current data — never a cached snapshot.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  const service = createServiceClient();
  const { data } = await service.from('profiles').select('*').eq('id', user.id).single();
  return data?.is_admin === true;
}

type Profile = {
  id: string; email: string | null; full_name: string | null;
  first_name: string | null; last_name: string | null; company_name: string | null;
};

function safeUserName(
  p: { full_name: string | null; first_name: string | null; last_name: string | null } | undefined | null
): string | null {
  if (!p) return null;
  const candidate = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || null;
  if (candidate && !isBadName(candidate)) return candidate;
  return null;
}

const RECENT = 12;

export async function GET() {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const service = createServiceClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  // ── Totals (accurate counts straight from each table) ──────────────────────
  const [
    users, newUsers7d, listingsTotal, buyerRequestsTotal, messagesTotal,
    conversationsTotal, scoutQuestions, analysisTotal, marketReportsTotal, emailsTotal,
    pendingListings, pendingAnalysis, pendingBuyerRequests,
  ] = await Promise.all([
    service.from('profiles').select('*', { count: 'exact', head: true }),
    service.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    service.from('listings').select('*', { count: 'exact', head: true }),
    service.from('buyer_requests').select('*', { count: 'exact', head: true }),
    service.from('messages').select('*', { count: 'exact', head: true }),
    service.from('conversations').select('*', { count: 'exact', head: true }),
    service.from('advisor_conversations').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    service.from('property_analysis_requests').select('*', { count: 'exact', head: true }),
    service.from('market_report_requests').select('*', { count: 'exact', head: true }),
    service.from('email_logs').select('*', { count: 'exact', head: true }),
    service.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    service.from('property_analysis_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    service.from('buyer_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
  ]);

  const totals = {
    users: users.count ?? 0,
    newUsers7d: newUsers7d.count ?? 0,
    listings: listingsTotal.count ?? 0,
    buyerRequests: buyerRequestsTotal.count ?? 0,
    messages: messagesTotal.count ?? 0,
    conversations: conversationsTotal.count ?? 0,
    scoutQuestions: scoutQuestions.count ?? 0,
    analysisRequests: analysisTotal.count ?? 0,
    marketReports: marketReportsTotal.count ?? 0,
    emails: emailsTotal.count ?? 0,
    pendingListings: pendingListings.count ?? 0,
    pendingAnalysis: pendingAnalysis.count ?? 0,
    pendingBuyerRequests: pendingBuyerRequests.count ?? 0,
  };

  // ── Recent rows per activity (most recent first) ───────────────────────────
  const [
    { data: signupRows },
    { data: listingRows },
    { data: buyerRows },
    { data: scoutRows },
    { data: analysisRows },
    { data: marketRows },
    { data: messageRows },
  ] = await Promise.all([
    service.from('profiles')
      .select('id, email, full_name, first_name, last_name, created_at, signup_source')
      .order('created_at', { ascending: false }).limit(RECENT),
    service.from('listings')
      .select('id, title, street_address, city, county, state, asking_price, status, created_at, user_id, owner_name, digital_signature')
      .order('created_at', { ascending: false }).limit(RECENT),
    service.from('buyer_requests')
      .select('id, display_name, display_company, target_state, target_county, target_city, target_regions, state, status, created_at, user_id')
      .order('created_at', { ascending: false }).limit(RECENT),
    service.from('advisor_conversations')
      .select('id, user_id, content, created_at').eq('role', 'user')
      .order('created_at', { ascending: false }).limit(RECENT),
    service.from('property_analysis_requests')
      .select('id, street_address, city, state, status, submitted_at, user_name, user_email')
      .order('submitted_at', { ascending: false }).limit(8),
    service.from('market_report_requests')
      .select('id, first_name, last_name, email, county, state, status, is_paid, report_frequency, created_at')
      .order('created_at', { ascending: false }).limit(8),
    service.from('messages')
      .select('id, conversation_id, sender_id, body, created_at')
      .order('created_at', { ascending: false }).limit(8),
  ]);

  // Resolve the profiles referenced by listings, buyer requests, scout, and messages.
  const convIds = [...new Set((messageRows ?? []).map(m => m.conversation_id).filter((x): x is string => !!x))];
  const { data: convRows } = convIds.length
    ? await service.from('conversations').select('id, buyer_id, seller_id').in('id', convIds)
    : { data: [] };
  const convMap = new Map((convRows ?? []).map(c => [c.id, c]));

  const profileIds = new Set<string>();
  for (const l of listingRows ?? []) if (l.user_id) profileIds.add(l.user_id);
  for (const b of buyerRows ?? []) if (b.user_id) profileIds.add(b.user_id);
  for (const s of scoutRows ?? []) if (s.user_id) profileIds.add(s.user_id);
  for (const c of convRows ?? []) { if (c.buyer_id) profileIds.add(c.buyer_id); if (c.seller_id) profileIds.add(c.seller_id); }

  const { data: profRows } = profileIds.size
    ? await service.from('profiles').select('id, email, full_name, first_name, last_name, company_name').in('id', [...profileIds])
    : { data: [] };
  const profMap = new Map<string, Profile>((profRows ?? []).map(p => [p.id, p as Profile]));

  // ── Shape each section ─────────────────────────────────────────────────────
  const signups = (signupRows ?? []).map(s => ({
    id: s.id,
    name: safeUserName(s) ?? '—',
    email: s.email,
    source: s.signup_source ?? null,
    created_at: s.created_at,
  }));

  const listings = (listingRows ?? []).map(l => ({
    id: l.id,
    title: l.title || 'Untitled listing',
    seller: getSellerName({ owner_name: l.owner_name, digital_signature: l.digital_signature, profiles: profMap.get(l.user_id ?? '') ?? null }),
    location: [l.city || l.street_address, l.county, l.state].filter(Boolean).join(', ') || '—',
    price: l.asking_price ?? null,
    status: l.status,
    created_at: l.created_at,
  }));

  const buyerRequests = (buyerRows ?? []).map(b => ({
    id: b.id,
    buyer: getBuyerName({ display_name: b.display_name, display_company: b.display_company, profiles: profMap.get(b.user_id ?? '') ?? null }),
    location: [b.target_city, b.target_county, b.target_state || b.state, ...(Array.isArray(b.target_regions) ? b.target_regions : [])]
      .filter(Boolean).slice(0, 3).join(', ') || '—',
    status: b.status,
    created_at: b.created_at,
  }));

  const scout = (scoutRows ?? []).map(s => {
    const p = s.user_id ? profMap.get(s.user_id) : undefined;
    return {
      id: s.id,
      asker: safeUserName(p) ?? (p?.email ?? 'Guest'),
      question: (s.content ?? '').slice(0, 140),
      created_at: s.created_at,
    };
  });

  const analysis = (analysisRows ?? []).map(a => ({
    id: a.id,
    location: [a.street_address, a.city, a.state].filter(Boolean).join(', ') || '—',
    user: !isBadName(a.user_name) ? (a.user_name || a.user_email) : (a.user_email || '—'),
    status: a.status,
    created_at: a.submitted_at,
  }));

  const marketReports = (marketRows ?? []).map(m => ({
    id: m.id,
    name: !isBadName([m.first_name, m.last_name].filter(Boolean).join(' ')) ? ([m.first_name, m.last_name].filter(Boolean).join(' ') || m.email) : (m.email || '—'),
    location: [m.county, m.state].filter(Boolean).join(', ') || '—',
    paid: !!m.is_paid,
    frequency: m.report_frequency ?? null,
    status: m.status,
    created_at: m.created_at,
  }));

  const messages = (messageRows ?? []).map(m => {
    const conv = m.conversation_id ? convMap.get(m.conversation_id) : undefined;
    const buyerP = conv?.buyer_id ? profMap.get(conv.buyer_id) : undefined;
    const sellerP = conv?.seller_id ? profMap.get(conv.seller_id) : undefined;
    const buyerName = buyerP ? getBuyerName({ profiles: buyerP }) : 'Buyer';
    const sellerName = sellerP ? getSellerName({ profiles: sellerP }) : 'Seller';
    let sender = 'LotScout Support';
    if (conv && m.sender_id === conv.buyer_id) sender = buyerName;
    else if (conv && m.sender_id === conv.seller_id) sender = sellerName;
    return {
      id: m.id,
      conversation_id: m.conversation_id,
      participants: `${buyerName} ↔ ${sellerName}`,
      sender,
      preview: (m.body ?? '').slice(0, 90),
      created_at: m.created_at,
    };
  });

  return NextResponse.json({
    totals,
    signups, listings, buyerRequests, scout, analysis, marketReports, messages,
  });
}
