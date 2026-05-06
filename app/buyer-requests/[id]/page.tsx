'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useUserTier } from '@/hooks/useUserTier';
import Header from '@/components/Header';

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
  const router = useRouter();
  const id = params.id as string;

  const [request, setRequest] = useState<BuyerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

  function handleMessage() {
    if (tierLoading) return;
    if (!tier) { setShowUpgradeModal(true); return; }
    router.push(`/messaging?recipient=${request?.user_id}`);
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
  const buyerName = request.display_name ||
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    request.display_company ||
    'Anonymous Buyer';
  const companyName = request.display_company || profile?.company_name?.trim() || null;

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

  return (
    <div className="bg-surface text-on-surface">
      <Header />
      {/* Upgrade modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Upgrade to Message Buyers</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Direct buyer messaging requires a paid LotScout account. Choose a plan to connect with active buyers.
            </p>
            <div className="flex gap-3">
              <Link href="/pricing" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors">
                View Plans →
              </Link>
              <button onClick={() => setShowUpgradeModal(false)} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-32 pb-24 max-w-7xl mx-auto px-8">

        {/* Back */}
        <div className="mb-8">
          <Link href="/buyer-directory" className="inline-flex items-center text-secondary hover:text-primary transition-colors font-medium">
            <span className="material-symbols-outlined mr-2">arrow_back</span>
            Back to Buyer Directory
          </Link>
        </div>

        {/* Identity Block */}
        <section className="bg-surface-container-lowest p-8 rounded-xl mb-10 flex flex-col md:flex-row items-center md:items-start gap-8 border border-outline-variant/15">
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-primary mb-1">{buyerName}</h1>
            {companyName && (
              <p className="text-xl text-secondary font-medium mb-4">{companyName}</p>
            )}
            {timelineLabel && (
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-on-surface-variant font-medium mt-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  Timeline: {timelineLabel}
                </div>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 w-full md:w-auto">
            <button
              onClick={handleMessage}
              className="w-full md:w-auto bg-primary text-on-primary px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined">chat_bubble</span>
              Message Buyer
            </button>
            <p className="text-[10px] text-center mt-2 text-on-surface-variant uppercase tracking-widest font-bold">LotScout Messaging Only</p>
          </div>
        </section>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">

          {/* Main content */}
          <div className="lg:col-span-7 space-y-10">

            {/* Property Criteria */}
            <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15">
              <div className="flex items-center gap-3 mb-8 border-b border-surface-container-low pb-4">
                <span className="material-symbols-outlined text-primary">map</span>
                <h2 className="text-2xl font-bold text-primary">Property Criteria</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <div className="space-y-6">
                  {(request.zoning_preference?.length ?? 0) > 0 && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Zoning</label>
                      <div className="flex flex-wrap gap-2">
                        {request.zoning_preference!.map(z => (
                          <span key={z} className="px-3 py-1 bg-primary-fixed/50 text-on-primary-fixed-variant text-sm font-semibold rounded-lg">
                            {z}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {acreageStr && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Acreage Range</label>
                      <p className="text-xl font-bold text-primary">{acreageStr}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  {budgetStr && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Financial Profile</label>
                      <div className="bg-surface-container-low p-4 rounded-xl">
                        <div className="flex justify-between items-end">
                          <span className="text-sm font-medium text-secondary">Total Budget</span>
                          <span className="text-xl font-black text-primary">{budgetStr}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {(request.contact_preference?.length ?? 0) > 0 && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Preferred Contact</label>
                      <p className="text-lg font-semibold text-secondary">{request.contact_preference!.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Target Location */}
            {hasLocation && (
              <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15">
                <div className="flex items-center gap-3 mb-8 border-b border-surface-container-low pb-4">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                  <h2 className="text-2xl font-bold text-primary">Target Location</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {locationState && (
                    <div className="p-4 bg-surface-container-low rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">State</span>
                      <span className="text-lg font-bold text-primary">{locationState}</span>
                    </div>
                  )}
                  {locationCounty && (
                    <div className="p-4 bg-surface-container-low rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">County</span>
                      <span className="text-lg font-bold text-primary">{locationCounty}</span>
                    </div>
                  )}
                  {locationCity && (
                    <div className="p-4 bg-surface-container-low rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">City</span>
                      <span className="text-lg font-bold text-primary">{locationCity}</span>
                    </div>
                  )}
                  {locationZip && (
                    <div className="p-4 bg-surface-container-low rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">Zip</span>
                      <span className="text-lg font-bold text-primary">{locationZip}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Intended Use */}
            {hasIntendedUse && (
              <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15">
                <div className="flex items-center gap-3 mb-8 border-b border-surface-container-low pb-4">
                  <span className="material-symbols-outlined text-primary">agriculture</span>
                  <h2 className="text-2xl font-bold text-primary">Intended Use</h2>
                </div>
                <div className="space-y-6">
                  {primaryUse && (
                    <div>
                      <h3 className="text-xl font-bold text-primary mb-2">{primaryUse}</h3>
                      {useDescription && (
                        <p className="text-secondary leading-relaxed">{useDescription}</p>
                      )}
                    </div>
                  )}
                  {request.additional_notes && (
                    <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-primary">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Additional Notes</label>
                      <p className="text-primary font-medium italic whitespace-pre-line">{request.additional_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View more from this buyer */}
            <div className="bg-surface-container-low rounded-xl p-6 flex items-center justify-between border border-outline-variant/10">
              <div>
                <p className="font-semibold text-on-surface text-sm">Looking for more buyers like this?</p>
                <p className="text-secondary text-xs mt-0.5">Browse the full directory of active buyers on LotScout.</p>
              </div>
              <Link
                href="/buyer-directory"
                className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline whitespace-nowrap"
              >
                View more requests
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>

          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-3 space-y-8">
            <div className="bg-primary p-8 rounded-xl text-on-primary shadow-lg">
              <h3 className="text-xl font-bold mb-4">Interested in connecting?</h3>
              <p className="text-on-primary-container text-sm mb-8 leading-relaxed opacity-90">
                This buyer is actively seeking land on LotScout. Secure direct matching is available for eligible land owners.
              </p>
              <button
                onClick={handleMessage}
                className="w-full bg-white text-primary py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-opacity-90 transition-all active:scale-95"
              >
                Send Message
              </button>
            </div>
          </aside>

        </div>
      </main>

      {/* Footer banner */}
      <section className="max-w-7xl mx-auto px-8 mb-24">
        <div className="bg-primary-fixed text-on-primary-fixed rounded-xl p-10 flex flex-col md:flex-row justify-between items-center gap-8 border border-primary/10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold text-primary mb-2">
              Are you a seller with land that matches these criteria?
            </h2>
            <p className="text-on-primary-fixed-variant text-lg">
              List your property today and get matched directly with high-intent buyers{companyName ? ` like ${companyName}` : ''}.
            </p>
          </div>
          <Link
            href="/create-listing"
            className="bg-primary text-on-primary px-10 py-5 rounded-xl font-black text-sm uppercase tracking-widest hover:opacity-90 shadow-lg whitespace-nowrap"
          >
            Create a Listing
          </Link>
        </div>
      </section>
    </div>
  );
}
