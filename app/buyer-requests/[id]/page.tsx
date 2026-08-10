'use client';

import { useEffect, useState } from 'react';
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
  display_name: string | null;
  display_company: string | null;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
  } | null;
}

const TIMELINE_LABELS: Record<string, string> = {
  'Actively Buying (0–30 days)': 'Under 30 days',
  'Short Term (1–3 months)': '1–3 months',
  'Medium Term (3–6 months)': '3–6 months',
  'Flexible (6+ months)': 'Flexible',
};

function fmt$(n: number | null) {
  if (!n) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
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
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !request) {
    return (
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-8 text-center">
        <p className="text-secondary text-lg">Buyer request not found.</p>
        <Link href="/buyer-directory" className="mt-4 inline-block text-primary font-semibold hover:underline">
          ← Back to Buyer Directory
        </Link>
      </div>
    );
  }

  const profile = request.profiles;
  const buyerName = getBuyerName({ ...request, profiles: profile });

  const timelineLabel = request.timeline
    ? (TIMELINE_LABELS[request.timeline] ?? request.timeline)
    : null;

  const budgetStr = (() => {
    const min = fmt$(request.budget_min);
    const max = fmt$(request.budget_max);
    if (min && max) return `${min} – ${max}`;
    if (min) return `${min}+`;
    if (max) return `Up to ${max}`;
    return null;
  })();

  const acreageStr = (() => {
    if (request.min_acreage && request.max_acreage)
      return `${request.min_acreage.toLocaleString()} – ${request.max_acreage.toLocaleString()} acres`;
    if (request.min_acreage) return `${request.min_acreage.toLocaleString()}+ acres`;
    if (request.max_acreage) return `Up to ${request.max_acreage.toLocaleString()} acres`;
    return null;
  })();

  // target_state/county/city/zip are the canonical single values.
  // Fall back to first element of target_regions for older records.
  const locationState = request.target_state || request.target_regions?.[0] || null;
  const locationCounty = request.target_county || request.target_regions?.[1] || null;
  const locationCity = request.target_city || request.target_regions?.[2] || null;
  const locationZip = request.target_zip || null;
  const hasLocation = !!(locationState || locationCounty || locationCity || locationZip);

  // use_case stored as "Primary Use Case — Description"
  const useCaseParts = (request.use_case ?? '').split(' — ');
  const primaryUse = useCaseParts[0]?.trim() || null;
  const useDescription = useCaseParts.slice(1).join(' — ').trim() || null;
  const hasIntendedUse = !!request.use_case?.trim();

  // Full state name (target_state may be stored as a 2-letter code).
  const fullStateName = locationState ? resolveStateQuery(locationState)[0] : null;
  // City tags from the comma-separated target_cities (fall back to single target_city).
  const rawCities = (request.target_cities ?? '').split(',').map(c => c.trim()).filter(Boolean);
  const cityTags = rawCities.length ? rawCities : (locationCity ? [locationCity] : []);

  const companyName = request.display_company || profile?.company_name || null;
  const reportRows = [
    { label: 'Budget', value: budgetStr },
    { label: 'Timeline', value: timelineLabel },
    { label: 'Lot Size', value: request.lot_size_label ?? acreageStr },
    { label: 'Primary Use', value: primaryUse },
  ].filter((row): row is { label: string; value: string } => !!row.value);

  const locationSummary = [
    cityTags.length ? cityTags.join(', ') : null,
    locationCounty ? `${locationCounty} County` : null,
    fullStateName || locationState,
    locationZip,
  ].filter(Boolean).join(' · ');

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Header />

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-secondary hover:text-on-surface">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Upgrade to Message Buyers</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Direct buyer messaging requires a paid LotScout account. Choose a plan to connect with active buyers.
            </p>
            <div className="flex gap-3">
              <Link href="/pricing" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors">View Plans →</Link>
              <button onClick={() => setShowUpgradeModal(false)} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      {/* Send message modal */}
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

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-xl font-semibold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          {toastMsg}
        </div>
      )}

      <main className="pt-24 pb-16 max-w-6xl mx-auto px-4 sm:px-6">

        <div className="mb-5">
          <Link href="/buyer-directory" className="inline-flex items-center gap-1 text-secondary hover:text-primary text-sm font-semibold transition-colors">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Buyer Directory
          </Link>
        </div>

        <article className="bg-white border border-outline-variant/20 rounded-2xl shadow-sm overflow-hidden">
          <header className="border-b border-outline-variant/15 px-6 sm:px-10 py-8 sm:py-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-secondary mb-3">Buyer Brief</p>
                <h1 className="font-headline text-3xl sm:text-5xl font-extrabold text-primary leading-tight tracking-tight">{buyerName}</h1>
                {companyName && <p className="mt-2 text-lg font-semibold text-secondary truncate max-w-2xl">{companyName}</p>}
                {primaryUse && <p className="mt-4 text-base text-on-surface font-medium capitalize">{primaryUse}</p>}
              </div>
              <button
                onClick={handleMessage}
                className="inline-flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm lg:shrink-0"
              >
                <span className="material-symbols-outlined text-base">forum</span>
                Message Buyer
              </button>
            </div>
          </header>

          {reportRows.length > 0 && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-outline-variant/15 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/15">
              {reportRows.map(row => (
                <div key={row.label} className="px-6 py-5 text-center">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-secondary mb-2">{row.label}</p>
                  <p className="text-lg font-extrabold text-primary leading-tight">{row.value}</p>
                </div>
              ))}
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0">
            <div className="px-6 sm:px-10 py-8 sm:py-10 space-y-9">
              {hasLocation && (
                <section>
                  <h2 className="font-headline text-xl font-extrabold text-primary mb-3">Target Location</h2>
                  <p className="text-base text-on-surface leading-relaxed">{locationSummary || 'Location not specified'}</p>
                </section>
              )}

              {hasIntendedUse && (
                <section>
                  <h2 className="font-headline text-xl font-extrabold text-primary mb-3">Acquisition Criteria</h2>
                  <div className="space-y-3 text-base text-on-surface leading-relaxed">
                    {useDescription && <p>{useDescription}</p>}
                    {(request.zoning_preference?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-secondary mb-2">Zoning Preference</p>
                        <div className="flex flex-wrap gap-2">
                          {request.zoning_preference!.map(z => (
                            <span key={z} className="px-3 py-1.5 rounded-full border border-outline-variant/25 text-sm font-semibold text-on-surface bg-surface-container-lowest">{z}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {request.additional_notes && (
                <section>
                  <h2 className="font-headline text-xl font-extrabold text-primary mb-3">Additional Notes</h2>
                  <p className="text-base text-on-surface-variant leading-relaxed whitespace-pre-line">{request.additional_notes}</p>
                </section>
              )}
            </div>

            <aside className="border-t lg:border-t-0 lg:border-l border-outline-variant/15 bg-surface-container-lowest px-6 py-8 sm:px-8 space-y-6">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-secondary mb-3">Summary</p>
                <dl className="space-y-4">
                  {budgetStr && <div><dt className="text-xs font-bold text-secondary uppercase tracking-wider">Budget</dt><dd className="text-sm font-bold text-primary mt-1">{budgetStr}</dd></div>}
                  {timelineLabel && <div><dt className="text-xs font-bold text-secondary uppercase tracking-wider">Timeline</dt><dd className="text-sm font-bold text-primary mt-1">{timelineLabel}</dd></div>}
                  {(request.lot_size_label || acreageStr) && <div><dt className="text-xs font-bold text-secondary uppercase tracking-wider">Lot Size</dt><dd className="text-sm font-bold text-primary mt-1">{request.lot_size_label ?? acreageStr}</dd></div>}
                  {locationSummary && <div><dt className="text-xs font-bold text-secondary uppercase tracking-wider">Location</dt><dd className="text-sm font-bold text-primary mt-1">{locationSummary}</dd></div>}
                </dl>
              </div>
              <div className="border-t border-outline-variant/15 pt-5">
                <p className="text-xs text-secondary">Posted {new Date(request.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </aside>
          </div>
        </article>
      </main>
    </div>
  );
}