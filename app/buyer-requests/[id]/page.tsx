'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useUserTier } from '@/hooks/useUserTier';
import Header from '@/components/Header';
import SendMessageModal from '@/components/SendMessageModal';
import { getBuyerName } from '@/lib/getBuyerName';
import { resolveStateQuery } from '@/lib/stateMap';

interface BuyerRequest {
  id: string;
  user_id: string;
  status: string;
  target_regions: string[] | null;
  target_state: string | null;
  target_county: string | null;
  target_city: string | null;
  target_zip: string | null;
  budget_min: number | null;
  budget_max: number | null;
  min_acreage: number | null;
  max_acreage: number | null;
  target_cities: string | null;
  lot_size_min: number | null;
  lot_size_max: number | null;
  lot_size_label: string | null;
  use_case: string | null;
  zoning_preference: string[] | null;
  timeline: string | null;
  additional_notes: string | null;
  contact_preference: string[] | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_website: string | null;
  display_name: string | null;
  display_company: string | null;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
  } | null;
}

interface ListingMatchRow {
  id: string;
  title: string | null;
  city: string | null;
  state: string | null;
  county: string | null;
  lot_size_acres: number | null;
  lot_size_sqft: number | null;
  zoning: string | null;
  status: string | null;
}

const TIMELINE_LABELS: Record<string, string> = {
  'Actively Buying (0–30 days)': 'Under 30 days',
  'Short Term (1–3 months)': '1–3 months',
  'Medium Term (3–6 months)': '3–6 months',
  'Flexible (6+ months)': 'Flexible',
};

const NOT_SPECIFIED = 'Not specified — ask before submitting';

function fmt$(n: number | null) {
  if (!n) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function humanizeStatus(value: string | null) {
  if (!value) return 'Not specified';
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function normalize(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase().replace(/\s+county$/i, '');
}

function splitUseCase(value: string | null) {
  const parts = (value ?? '').split(' — ');
  return {
    primaryUse: parts[0]?.trim() || null,
    useDescription: parts.slice(1).join(' — ').trim() || null,
  };
}

function lotSizeText(label: string | null, min: number | null, max: number | null) {
  if (label) return label;
  const f = (n: number) => `${Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 1 })} acres`;
  if (min && max) return `${f(min)} – ${f(max)}`;
  if (min) return `${f(min)}+`;
  if (max) return `Up to ${f(max)}`;
  return null;
}

function zoningMatches(listingZoning: string | null, preferences: string[] | null) {
  const prefs = (preferences ?? []).map(normalize).filter(Boolean);
  const listing = normalize(listingZoning);
  if (!prefs.length || !listing) return true;
  return prefs.some(pref => listing.includes(pref) || pref.includes(listing));
}

function acreageMatches(listing: ListingMatchRow, min: number | null, max: number | null) {
  const acres = listing.lot_size_acres ?? (listing.lot_size_sqft ? listing.lot_size_sqft / 43560 : null);
  if (acres === null) return true;
  if (min !== null && acres < min) return false;
  if (max !== null && acres > max) return false;
  return true;
}

function marketMatches(listing: ListingMatchRow, markets: string[]) {
  const normalizedMarkets = markets.map(normalize).filter(Boolean);
  if (!normalizedMarkets.length) return true;
  const listingValues = [listing.city, listing.county, listing.state].map(normalize).filter(Boolean);
  return normalizedMarkets.some(market => listingValues.some(value => value === market || value.includes(market) || market.includes(value)));
}

function getOptionalString(source: unknown, keys: string[]) {
  if (!source || typeof source !== 'object') return null;
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export default function BuyerRequestPage() {
  const params = useParams();
  const id = params.id as string;

  const [request, setRequest] = useState<BuyerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [briefCount, setBriefCount] = useState<number | null>(null);
  const [matchCount, setMatchCount] = useState(0);

  const { tier, loading: tierLoading } = useUserTier();

  useEffect(() => {
    if (!id) return;
    (async () => {
      const supabase = createClient();

      const { data: req, error } = await supabase
        .from('buyer_requests')
        .select('*, profiles(first_name, last_name, company_name)')
        .eq('id', id)
        .single();

      if (error) { console.error('buyer_requests fetch error:', error); setNotFound(true); setLoading(false); return; }
      if (!req) { setNotFound(true); setLoading(false); return; }
      setRequest(req as BuyerRequest);
      setLoading(false);
    })();
  }, [id]);

  const profile = request?.profiles ?? null;
  const buyerName = request ? getBuyerName({ ...request, profiles: profile }) : '';
  const { primaryUse, useDescription } = splitUseCase(request?.use_case ?? null);
  const timelineLabel = request?.timeline ? (TIMELINE_LABELS[request.timeline] ?? request.timeline) : null;
  const isUrgent = !!request?.timeline && /actively buying|0.?30|under 30/i.test(request.timeline);
  const budgetStr = useMemo(() => {
    if (!request) return null;
    const min = fmt$(request.budget_min);
    const max = fmt$(request.budget_max);
    if (min && max) return `${min} – ${max}`;
    if (min) return `${min}+`;
    if (max) return `Up to ${max}`;
    return null;
  }, [request]);
  const acreageMin = request?.min_acreage ?? request?.lot_size_min ?? null;
  const acreageMax = request?.max_acreage ?? request?.lot_size_max ?? null;
  const lotSize = request ? lotSizeText(request.lot_size_label, acreageMin, acreageMax) : null;
  const locationState = request?.target_state || request?.target_regions?.[0] || null;
  const locationCounty = request?.target_county || request?.target_regions?.[1] || null;
  const locationCity = request?.target_city || request?.target_regions?.[2] || null;
  const locationZip = request?.target_zip || null;
  const fullStateName = locationState ? resolveStateQuery(locationState)[0] : null;
  const cityTags = useMemo(() => {
    const rawCities = (request?.target_cities ?? '').split(',').map(c => c.trim()).filter(Boolean);
    return rawCities.length ? rawCities : (locationCity ? [locationCity] : []);
  }, [request?.target_cities, locationCity]);
  const locationChips = useMemo(() => [
    ...cityTags,
    locationCounty ? `${locationCounty} County` : null,
    fullStateName || locationState,
    locationZip,
    ...(request?.target_regions ?? []).filter(Boolean),
  ].filter((value, index, arr): value is string => !!value && arr.indexOf(value) === index), [cityTags, locationCounty, fullStateName, locationState, locationZip, request?.target_regions]);
  const marketLabel = locationCounty ? `${locationCounty} County` : cityTags[0] || fullStateName || locationState || 'this market';
  const buyerType = primaryUse || 'Buyer';
  const postedDate = request ? fmtDate(request.created_at) : null;
  const responseTime = getOptionalString(request, ['response_time', 'response_time_label', 'average_response_time', 'avg_response_time']);
  const matchSearch = locationCounty || cityTags[0] || fullStateName || locationState || '';
  const matchLink = `/marketplace?mine=true&search=${encodeURIComponent(matchSearch)}${acreageMin ? `&minAcres=${encodeURIComponent(String(acreageMin))}` : ''}${acreageMax ? `&maxAcres=${encodeURIComponent(String(acreageMax))}` : ''}${request?.zoning_preference?.[0] ? `&zoning=${encodeURIComponent(request.zoning_preference[0])}` : ''}`;
  const placeLabel = [cityTags[0] || locationCounty, fullStateName || locationState].filter(Boolean).join(', ') || 'Target market';
  const leadTitle = lotSize ? `${lotSize} in ${placeLabel}` : `Land opportunity in ${placeLabel}`;
  const listedBy = request?.display_company?.trim() || buyerName;

  useEffect(() => {
    if (!request) return;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const [{ count }, { data: rows, error }] = await Promise.all([
        supabase
          .from('buyer_requests')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', request.user_id),
        supabase
          .from('listings')
          .select('id,title,city,state,county,lot_size_acres,lot_size_sqft,zoning,status')
          .eq('user_id', user.id)
          .in('status', ['active', 'published', 'pending_review', 'revision_needed', 'draft']),
      ]);

      setBriefCount(count ?? null);
      if (error) { console.error('listing match fetch error:', error); return; }

      const markets = [
        ...cityTags,
        locationCounty,
        locationState,
        fullStateName,
        ...(request.target_regions ?? []),
      ].filter((v): v is string => !!v);

      const matches = (rows ?? []).filter(row =>
        marketMatches(row as ListingMatchRow, markets) &&
        acreageMatches(row as ListingMatchRow, acreageMin, acreageMax) &&
        zoningMatches((row as ListingMatchRow).zoning, request.zoning_preference)
      );
      setMatchCount(matches.length);
    })();
  }, [request, cityTags, locationCounty, locationState, fullStateName, acreageMin, acreageMax]);

  async function handleMessage() {
    if (tierLoading) return;
    if (!tier) { setShowUpgradeModal(true); return; }
    if (!currentUserId) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    }
    setShowMessageModal(true);
  }

  if (loading) {
    return (
      <div className="bg-[#F5F8F6] pt-32 pb-24 max-w-7xl mx-auto px-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !request) {
    return (
      <div className="bg-[#F5F8F6] pt-32 pb-24 max-w-7xl mx-auto px-8 text-center">
        <p className="text-[#5C6D64] text-lg">Buyer request not found.</p>
        <Link href="/buyer-directory" className="mt-4 inline-block text-[#14795A] font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D9E75]">
          ← Back to Buyer Directory
        </Link>
      </div>
    );
  }

  const criteriaRows = [
    { label: 'Budget', value: budgetStr, description: budgetStr ? `Target purchase range: ${budgetStr}` : null },
    { label: 'Lot Size', value: lotSize, description: lotSize ? `Preferred parcel size: ${lotSize}` : null },
    { label: 'Primary Use', value: primaryUse, description: useDescription || (primaryUse ? `Buyer is evaluating land for ${primaryUse.toLowerCase()}.` : null) },
    { label: 'Zoning', value: request.zoning_preference?.length ? request.zoning_preference.join(', ') : null, description: request.zoning_preference?.length ? `Preferred zoning: ${request.zoning_preference.join(', ')}` : null },
    { label: 'Timeline', value: timelineLabel, description: timelineLabel ? `Acquisition timeline: ${timelineLabel}` : null },
  ];
  const specifiedCriteriaCount = criteriaRows.filter(row => !!row.value).length;
  const marketsText = locationChips.length ? locationChips.slice(0, 3).join(', ') : null;

  return (
    <div className="min-h-screen bg-[#F5F8F6] text-[#0D1F16] font-body">
      <Header />

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10 border border-[#E2EAE6]">
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-[#5C6D64] hover:text-[#0D1F16] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D9E75]">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="w-12 h-12 bg-[#EAF6F1] rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-[#14795A] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-[#0D1F16] mb-2">Upgrade to Message Buyers</h2>
            <p className="text-[#5C6D64] text-sm mb-6 leading-relaxed">Direct buyer messaging requires a paid LotScout account. Choose a plan to connect with active buyers.</p>
            <div className="flex gap-3">
              <Link href="/pricing" className="flex-1 bg-[#1D9E75] text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-[#14795A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D9E75]">View Plans →</Link>
              <button onClick={() => setShowUpgradeModal(false)} className="flex-1 border border-[#E2EAE6] text-[#5C6D64] py-3 rounded-xl font-bold text-sm hover:bg-[#F5F8F6] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D9E75]">Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      {showMessageModal && currentUserId && request && (
        <SendMessageModal
          recipientId={request.user_id}
          recipientName={buyerName}
          currentUserId={currentUserId}
          currentUserIsBuyer={false}
          onClose={() => setShowMessageModal(false)}
          onSent={() => { setShowMessageModal(false); setToastMsg('Message sent successfully'); setTimeout(() => setToastMsg(''), 3000); }}
        />
      )}

      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#14795A] text-white px-6 py-3 rounded-xl shadow-xl font-semibold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          {toastMsg}
        </div>
      )}

      <main className="mx-auto max-w-[1180px] px-4 sm:px-6 pt-24 pb-16">
        <div className="mb-5">
          <Link href="/buyer-directory" className="inline-flex items-center gap-1 text-[#5C6D64] hover:text-[#14795A] text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D9E75] rounded-md">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Buyer Directory
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-7 items-start">
          <section className="space-y-5 min-w-0">
            <div className="bg-white border border-[#E2EAE6] rounded-2xl p-5 sm:p-7 shadow-sm">
              <h1 className="font-headline text-[28px] sm:text-[36px] leading-[1.05] font-extrabold tracking-tight text-[#0D1F16]">{leadTitle}</h1>
              <p className="mt-2 text-sm font-semibold text-[#5C6D64]">Listed by {listedBy}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#5C6D64]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF6F1] px-2.5 py-1 font-headline text-xs font-bold text-[#14795A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1D9E75]" /> Verified
                </span>
                <span>{buyerType}</span>
                {(fullStateName || locationState) && <span>{fullStateName || locationState}</span>}
                {postedDate && <span>Posted {postedDate}</span>}
              </div>
            </div>

            <section className="bg-white border border-[#E2EAE6] rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="font-headline text-xl font-extrabold text-[#0D1F16]">What they&apos;re buying</h2>
                <span className="font-headline text-xs font-bold text-[#5C6D64] bg-[#F5F8F6] border border-[#E2EAE6] rounded-full px-3 py-1">{specifiedCriteriaCount}/{criteriaRows.length} specified</span>
              </div>
              <div className="space-y-4">
                {criteriaRows.map(row => {
                  const specified = !!row.value;
                  return (
                    <div key={row.label} className="flex gap-3">
                      <span className={`mt-1 h-7 w-7 shrink-0 rounded-full flex items-center justify-center border ${specified ? 'bg-[#EAF6F1] border-[#BFE7D8]' : 'bg-[#F5F8F6] border-[#E2EAE6]'}`}>
                        <span className={`h-2 w-2 rounded-full ${specified ? 'bg-[#1D9E75]' : 'bg-[#C5D0CA]'}`} />
                      </span>
                      <div className="min-w-0">
                        <p className={`font-headline font-extrabold ${specified ? 'text-[#0D1F16]' : 'text-[#5C6D64]'}`}>{row.label}</p>
                        <p className={`text-sm leading-relaxed ${specified ? 'text-[#5C6D64]' : 'text-[#5C6D64]/75 italic'}`}>{row.description || NOT_SPECIFIED}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-white border border-[#E2EAE6] rounded-2xl p-5 sm:p-6 shadow-sm">
              <h2 className="font-headline text-xl font-extrabold text-[#0D1F16] mb-4">Where they&apos;re buying</h2>
              <div className="flex flex-wrap gap-2">
                {locationChips.length > 0 ? locationChips.map(chip => (
                  <span key={chip} className="rounded-full bg-[#EAF6F1] border border-[#BFE7D8] px-3 py-1.5 font-headline text-xs font-bold text-[#14795A]">{chip}</span>
                )) : (
                  <span className="rounded-full bg-[#F5F8F6] border border-[#E2EAE6] px-3 py-1.5 font-headline text-xs font-bold text-[#5C6D64]">Market not specified</span>
                )}
              </div>
              {matchCount >= 1 && (
                <Link href={matchLink} className="mt-4 inline-flex text-sm font-bold text-[#14795A] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D9E75] rounded-md">
                  You have {matchCount} {matchCount === 1 ? 'listing' : 'listings'} in {marketLabel} that match this brief.
                </Link>
              )}
            </section>

            <section className="bg-white border border-[#E2EAE6] rounded-2xl p-5 sm:p-6 shadow-sm">
              <h2 className="font-headline text-xl font-extrabold text-[#0D1F16] mb-3">Notes from the buyer</h2>
              {request.additional_notes?.trim() ? (
                <p className="text-sm sm:text-base text-[#5C6D64] leading-relaxed whitespace-pre-line">{request.additional_notes}</p>
              ) : (
                <div>
                  <p className="font-headline font-extrabold text-[#0D1F16]">No notes yet</p>
                  <p className="mt-1 text-sm text-[#5C6D64]">Use the message action to ask the buyer for extra context before submitting a property.</p>
                </div>
              )}
            </section>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-5">
            <section className="bg-white border border-[#E2EAE6] rounded-2xl p-5 shadow-sm">
              {isUrgent ? (
                <div className="mb-4 rounded-xl bg-[#FCF4E6] px-3 py-2 text-[#A96A00] font-headline text-sm font-extrabold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#A96A00] motion-safe:animate-pulse" />
                  Closing in under 30 days
                </div>
              ) : timelineLabel ? (
                <div className="mb-4 rounded-xl bg-[#F5F8F6] border border-[#E2EAE6] px-3 py-2 text-[#5C6D64] font-headline text-sm font-bold">Timeline: {timelineLabel}</div>
              ) : null}

              <dl className="space-y-3 border-y border-[#E2EAE6] py-4">
                <div><dt className="font-headline text-[11px] font-extrabold uppercase tracking-widest text-[#5C6D64]">Lot size</dt><dd className="mt-0.5 font-headline font-bold text-[#0D1F16]">{lotSize || 'Not specified'}</dd></div>
                <div><dt className="font-headline text-[11px] font-extrabold uppercase tracking-widest text-[#5C6D64]">Primary use</dt><dd className="mt-0.5 font-headline font-bold text-[#0D1F16]">{primaryUse || 'Not specified'}</dd></div>
                <div><dt className="font-headline text-[11px] font-extrabold uppercase tracking-widest text-[#5C6D64]">Markets</dt><dd className="mt-0.5 font-headline font-bold text-[#0D1F16]">{marketsText || 'Not specified'}</dd></div>
                <div><dt className="font-headline text-[11px] font-extrabold uppercase tracking-widest text-[#5C6D64]">Buyer type</dt><dd className="mt-0.5 font-headline font-bold text-[#0D1F16]">{buyerType}</dd></div>
              </dl>

              <div className="mt-4 space-y-2">
                {request.contact_email && (
                  <a href={`mailto:${request.contact_email}`} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D9E75] px-4 py-3 text-white font-headline text-sm font-extrabold hover:bg-[#14795A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D9E75]">
                    <span className="material-symbols-outlined text-base">mail</span>
                    Email poster
                  </a>
                )}
                {request.contact_phone && (
                  <a href={`tel:${request.contact_phone}`} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E2EAE6] bg-white px-4 py-3 text-[#0D1F16] font-headline text-sm font-extrabold hover:bg-[#F5F8F6] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D9E75]">
                    <span className="material-symbols-outlined text-base">call</span>
                    {request.contact_phone}
                  </a>
                )}
                <button onClick={handleMessage} className="w-full rounded-xl bg-[#1D9E75] px-4 py-3 text-white font-headline text-sm font-extrabold hover:bg-[#14795A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D9E75]">Message poster</button>
              </div>
              {responseTime && <p className="mt-3 text-xs text-[#5C6D64]">Typically responds {responseTime}</p>}
            </section>

            <section className="bg-white border border-[#E2EAE6] rounded-2xl p-5 shadow-sm">
              <h2 className="font-headline text-base font-extrabold text-[#0D1F16] mb-4">About this lead</h2>
              <dl className="space-y-3">
                <div><dt className="font-headline text-[11px] font-extrabold uppercase tracking-widest text-[#5C6D64]">Listed by</dt><dd className="mt-0.5 font-bold text-[#0D1F16]">{listedBy}</dd></div>
                {request.contact_email && <div><dt className="font-headline text-[11px] font-extrabold uppercase tracking-widest text-[#5C6D64]">Email</dt><dd className="mt-0.5 font-bold text-[#0D1F16] break-all">{request.contact_email}</dd></div>}
                {request.contact_phone && <div><dt className="font-headline text-[11px] font-extrabold uppercase tracking-widest text-[#5C6D64]">Phone</dt><dd className="mt-0.5 font-bold text-[#0D1F16]">{request.contact_phone}</dd></div>}
                {request.contact_website && <div><dt className="font-headline text-[11px] font-extrabold uppercase tracking-widest text-[#5C6D64]">Website</dt><dd className="mt-0.5 font-bold text-[#0D1F16] break-all">{request.contact_website}</dd></div>}
                <div><dt className="font-headline text-[11px] font-extrabold uppercase tracking-widest text-[#5C6D64]">Verification</dt><dd className="mt-0.5 font-bold text-[#0D1F16]">{request.status === 'active' ? 'Verified' : humanizeStatus(request.status)}</dd></div>
                {briefCount !== null && <div><dt className="font-headline text-[11px] font-extrabold uppercase tracking-widest text-[#5C6D64]">Request count</dt><dd className="mt-0.5 font-bold text-[#0D1F16]">{briefCount}</dd></div>}
                {postedDate && <div><dt className="font-headline text-[11px] font-extrabold uppercase tracking-widest text-[#5C6D64]">Active since</dt><dd className="mt-0.5 font-bold text-[#0D1F16]">{postedDate}</dd></div>}
              </dl>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
