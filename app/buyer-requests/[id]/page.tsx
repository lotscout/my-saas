'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useUserTier } from '@/hooks/useUserTier';
import Header from '@/components/Header';
import SendMessageModal from '@/components/SendMessageModal';
import { getBuyerName } from '@/lib/getBuyerName';

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

      <main className="pt-20 pb-12 max-w-5xl mx-auto px-4 sm:px-6">

        {/* Back */}
        <div className="mb-4">
          <Link href="/buyer-directory" className="inline-flex items-center gap-1 text-secondary hover:text-primary text-sm font-semibold transition-colors">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Buyer Directory
          </Link>
        </div>

        {/* Main card */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">

          {/* Header row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-outline-variant/15">
            <div>
              <h1 className="font-headline text-2xl font-extrabold text-primary leading-tight">{buyerName}</h1>
              {companyName && <p className="text-secondary text-sm font-medium mt-0.5">{companyName}</p>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {timelineLabel && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-secondary bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/20">
                  <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                  {timelineLabel}
                </span>
              )}
              <button
                onClick={handleMessage}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-base">forum</span>
                Message Buyer
              </button>
            </div>
          </div>

          {/* Key stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-outline-variant/15 border-b border-outline-variant/15">
            {budgetStr && (
              <div className="px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Budget</p>
                <p className="text-base font-extrabold text-primary">{budgetStr}</p>
              </div>
            )}
            {acreageStr && (
              <div className="px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Acreage</p>
                <p className="text-base font-extrabold text-primary">{acreageStr}</p>
              </div>
            )}
            {hasLocation && (
              <div className="px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Location</p>
                <p className="text-base font-extrabold text-primary">
                  {[locationCity, locationCounty ? `${locationCounty} Co.` : null, locationState, locationZip].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
            {primaryUse && (
              <div className="px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Use Case</p>
                <p className="text-base font-extrabold text-primary">{primaryUse}</p>
              </div>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/15">

            {/* Left col */}
            <div className="px-6 py-5 space-y-4">
              {(request.zoning_preference?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Zoning Preference</p>
                  <div className="flex flex-wrap gap-1.5">
                    {request.zoning_preference!.map(z => (
                      <span key={z} className="px-2.5 py-1 bg-primary/8 text-primary text-xs font-bold rounded-lg">{z}</span>
                    ))}
                  </div>
                </div>
              )}
              {request.target_cities && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Target Cities</p>
                  <p className="text-sm font-semibold text-on-surface">{request.target_cities}</p>
                </div>
              )}
              {request.lot_size_label && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Lot Size</p>
                  <p className="text-sm font-semibold text-on-surface">{request.lot_size_label}</p>
                </div>
              )}
              {(request.contact_preference?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Preferred Contact</p>
                  <p className="text-sm font-semibold text-on-surface">{request.contact_preference!.join(', ')}</p>
                </div>
              )}
              {useDescription && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Use Details</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{useDescription}</p>
                </div>
              )}
            </div>

            {/* Right col */}
            <div className="px-6 py-5">
              {request.additional_notes ? (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Additional Notes</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{request.additional_notes}</p>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-secondary/40 text-sm italic">No additional notes</div>
              )}
            </div>

          </div>

          {/* Footer CTA */}
          <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/15 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-secondary">Have land that matches these criteria? Connect directly with this buyer.</p>
            <Link href="/create-listing" className="text-xs font-bold text-primary hover:underline whitespace-nowrap flex items-center gap-1">
              List your property <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}