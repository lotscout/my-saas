'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserTier } from '@/hooks/useUserTier';

// ─── Types ────────────────────────────────────────────────────────────────────

type MainTab = 'directory' | 'requests';
type DirectoryView = 'grid' | 'national' | 'by-state' | 'active';

interface BuyerRequest {
  id: string;
  user_id: string;
  status: string;
  target_state: string | null;
  target_regions: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  min_acreage: number | null;
  max_acreage: number | null;
  use_case: string | null;
  zoning_preference: string[] | null;
  timeline: string | null;
  additional_notes: string | null;
  display_name: string | null;
  display_company: string | null;
  contact_phone: string | null;
  contact_phone_type: string | null;
  contact_email: string | null;
  contact_website: string | null;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    avatar_url: string | null;
  } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

const SELECT_CLS = 'bg-surface-container-low px-3 py-2 rounded-lg border border-transparent hover:border-primary/20 text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBudget(min: number | null, max: number | null): string {
  const f = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;
  if (min && max) return `${f(min)} – ${f(max)}`;
  if (min) return `${f(min)}+`;
  if (max) return `Up to ${f(max)}`;
  return 'Flexible';
}

function getBuyerName(req: BuyerRequest) {
  if (req.display_name) return req.display_name;
  const p = req.profiles;
  return [p?.first_name, p?.last_name].filter(Boolean).join(' ') || req.display_company || 'Anonymous Buyer';
}

function getInitials(req: BuyerRequest) {
  if (req.display_company) return req.display_company.substring(0, 2).toUpperCase();
  const p = req.profiles;
  return ([p?.first_name?.[0], p?.last_name?.[0]].filter(Boolean).join('').toUpperCase()) || 'AB';
}

function applyBudgetFilter(req: BuyerRequest, f: string): boolean {
  const max = req.budget_max ?? 0;
  const min = req.budget_min ?? 0;
  if (!f) return true;
  if (f === 'under50k') return max < 50_000;
  if (f === '50k-100k') return max >= 50_000 && max < 100_000;
  if (f === '100k-500k') return max >= 100_000 && max < 500_000;
  if (f === '500k-1m') return max >= 500_000 && max < 1_000_000;
  if (f === '1m-5m') return max >= 1_000_000 && max < 5_000_000;
  if (f === '5m+') return (max || min) >= 5_000_000;
  return true;
}

function applyAcreageFilter(req: BuyerRequest, f: string): boolean {
  const acres = req.min_acreage ?? 0;
  if (!f) return true;
  if (f === 'under5') return acres < 5;
  if (f === '5-25') return acres >= 5 && acres < 25;
  if (f === '25-100') return acres >= 25 && acres < 100;
  if (f === '100-500') return acres >= 100 && acres < 500;
  if (f === '500+') return acres >= 500;
  return true;
}

// ─── Shared BuyerRow ─────────────────────────────────────────────────────────

interface BuyerRowProps {
  req: BuyerRequest;
  canViewContact: boolean;
  showTimeline?: boolean;
}

function BuyerRow({ req, canViewContact, showTimeline = true }: BuyerRowProps) {
  const name = getBuyerName(req);
  const initials = getInitials(req);
  const company = req.profiles?.company_name || null;
  const blur = !canViewContact;

  return (
    <Link
      href={`/buyer-requests/${req.id}`}
      className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-md hover:border-primary/20 transition-all"
    >
      {/* Avatar + identity */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ${blur ? 'blur-sm' : ''}`}>
          {req.profiles?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={req.profiles.avatar_url} alt="Buyer" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-primary font-bold text-sm">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className={`font-bold text-primary text-sm truncate ${blur ? 'blur-sm select-none' : ''}`}>{name}</p>
          {(req.display_company || company) && (
            <p className={`text-xs text-secondary truncate ${blur ? 'blur-sm select-none' : ''}`}>{req.display_company || company}</p>
          )}
          {req.contact_website && (
            <a href={`https://${req.contact_website}`} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs text-primary/70 hover:text-primary font-medium transition-colors">
              {req.contact_website}
            </a>
          )}
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs shrink-0">
        {req.target_state && (
          <span className="flex items-center gap-1 text-secondary">
            <span className="material-symbols-outlined text-sm">location_on</span>
            {req.target_state}
          </span>
        )}
        <span className="font-semibold text-on-surface">{fmtBudget(req.budget_min, req.budget_max)}</span>
        {req.use_case && (
          <span className="bg-primary/8 text-primary px-2 py-0.5 rounded-full font-bold capitalize">{req.use_case.split(' — ')[0]}</span>
        )}
        {showTimeline && req.timeline && (
          <span className="text-secondary hidden md:inline">{req.timeline}</span>
        )}
      </div>
    </Link>
  );
}

// ─── BuyerRequestCard (for Requests tab) ──────────────────────────────────────

interface BuyerCardProps {
  req: BuyerRequest;
  canViewContact: boolean;
}

function BuyerRequestCard({ req, canViewContact }: BuyerCardProps) {
  const name = getBuyerName(req);
  const initials = getInitials(req);
  const blur = !canViewContact;

  return (
    <Link
      href={`/buyer-requests/${req.id}`}
      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-6 flex flex-col gap-4 hover:shadow-lg hover:border-primary/25 transition-all"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${blur ? 'blur-sm' : ''}`}>
            {req.profiles?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={req.profiles.avatar_url} alt="Buyer" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">{initials}</span>
              </div>
            )}
          </div>
          <div>
            <p className={`font-bold text-primary text-sm ${blur ? 'blur-sm select-none' : ''}`}>{name}</p>
            <p className="text-[10px] text-secondary uppercase tracking-widest font-bold">Verified Buyer</p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 text-sm">
        {(req.target_regions?.length ?? 0) > 0 && (
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-secondary text-base mt-0.5">location_on</span>
            <span className="text-on-surface-variant">{req.target_regions!.join(', ')}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-base">payments</span>
          <span className="text-on-surface-variant">{fmtBudget(req.budget_min, req.budget_max)}</span>
        </div>
        {req.min_acreage && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-base">landscape</span>
            <span className="text-on-surface-variant">
              {req.min_acreage}{req.max_acreage ? ` – ${req.max_acreage}` : '+'} acres
            </span>
          </div>
        )}
        {req.use_case && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-base">agriculture</span>
            <span className="bg-primary/8 text-primary px-2 py-0.5 rounded-full text-xs font-bold capitalize">{req.use_case.split(' — ')[0]}</span>
          </div>
        )}
        {req.timeline && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-base">schedule</span>
            <span className="text-on-surface-variant text-xs">{req.timeline}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Sub-view back header ─────────────────────────────────────────────────────

function ViewHeader({ title, subtitle, count, onBack }: { title: string; subtitle: string; count?: number; onBack: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-secondary hover:text-primary text-sm font-semibold mb-3 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Directory
        </button>
        <h2 className="font-headline text-2xl font-extrabold text-primary">{title}</h2>
        <p className="text-secondary text-sm mt-1">{subtitle}</p>
      </div>
      {count !== undefined && (
        <div className="bg-primary/8 text-primary px-4 py-2 rounded-xl text-sm font-bold shrink-0">
          {count} buyer{count !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BuyerDirectoryPage() {
  const { tier, isAdmin, isAtLeast, loading: permLoading } = useUserTier();
  const router = useRouter();

  const canViewContact = !permLoading && (isAtLeast('priority') || !!isAdmin);

  // ── Navigation state ──
  const [tab, setTab] = useState<MainTab>('directory');
  const [view, setView] = useState<DirectoryView>('grid');

  // ── Global search ──
  const [globalSearch, setGlobalSearch] = useState('');

  // ── Upgrade modal ──
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ── National buyers ──
  const [nationalBuyers, setNationalBuyers] = useState<BuyerRequest[]>([]);
  const [nationalLoading, setNationalLoading] = useState(false);
  const [nationalUseCase, setNationalUseCase] = useState('');
  const [nationalRoadAccess, setNationalRoadAccess] = useState('');

  // ── By-state buyers ──
  const [selectedState, setSelectedState] = useState('');
  const [stateBuyers, setStateBuyers] = useState<BuyerRequest[]>([]);
  const [stateLoading, setStateLoading] = useState(false);
  const [stateSearched, setStateSearched] = useState('');
  const [stateRoadAccess, setStateRoadAccess] = useState('');

  // ── Active buyers ──
  const [activeBuyers, setActiveBuyers] = useState<BuyerRequest[]>([]);
  const [activeLoading, setActiveLoading] = useState(false);
  const [activeStateFilter, setActiveStateFilter] = useState('');
  const [activeUseCaseFilter, setActiveUseCaseFilter] = useState('');
  const [activeRoadAccess, setActiveRoadAccess] = useState('');

  // ── Buyer requests tab ──
  const [buyerRequests, setBuyerRequests] = useState<BuyerRequest[]>([]);
  const [brLoading, setBrLoading] = useState(false);
  const [brSearch, setBrSearch] = useState('');
  const [filterBudget, setFilterBudget] = useState('');
  const [filterAcreage, setFilterAcreage] = useState('');
  const [filterZoning, setFilterZoning] = useState('');
  const [filterUseCase, setFilterUseCase] = useState('');
  const [filterTimeline, setFilterTimeline] = useState('');
  const [filterRoadAccessBR, setFilterRoadAccessBR] = useState('');

  // ── Data fetching ──

  useEffect(() => {
    if (view !== 'national') return;
    setNationalLoading(true);
    fetch('/api/buyer-directory?status=active&limit=200')
      .then(r => r.json())
      .then(({ requests }) => { setNationalBuyers((requests ?? []) as BuyerRequest[]); setNationalLoading(false); })
      .catch(() => setNationalLoading(false));
  }, [view]);

  function loadStateBuyers(state: string) {
    if (!state) return;
    setStateLoading(true);
    setStateSearched(state);
    fetch(`/api/buyer-directory?status=active&state=${encodeURIComponent(state)}&limit=50`)
      .then(r => r.json())
      .then(({ requests }) => { setStateBuyers((requests ?? []) as BuyerRequest[]); setStateLoading(false); })
      .catch(() => setStateLoading(false));
  }

  useEffect(() => {
    if (view !== 'active') return;
    setActiveLoading(true);
    fetch(`/api/buyer-directory?status=active&timeline=${encodeURIComponent('Actively Buying (0–30 days)')}`)
      .then(r => r.json())
      .then(({ requests }) => { setActiveBuyers((requests ?? []) as BuyerRequest[]); setActiveLoading(false); })
      .catch(() => setActiveLoading(false));
  }, [view]);

  useEffect(() => {
    if (tab !== 'requests') return;
    setBrLoading(true);
    fetch('/api/buyer-directory?status=active&limit=200')
      .then(r => r.json())
      .then(({ requests }) => { setBuyerRequests((requests ?? []) as BuyerRequest[]); setBrLoading(false); })
      .catch(() => setBrLoading(false));
  }, [tab]);

  // ── Filtered lists ──

  const filteredNational = useMemo(() => {
    const q = globalSearch.toLowerCase();
    return nationalBuyers.filter(r => {
      const name = getBuyerName(r).toLowerCase();
      const co = (r.profiles?.company_name ?? '').toLowerCase();
      const state = (r.target_state ?? '').toLowerCase();
      const uc = (r.use_case ?? '').toLowerCase();
      const matchSearch = !q || name.includes(q) || co.includes(q) || state.includes(q) || uc.includes(q);
      const matchUC = !nationalUseCase || uc.includes(nationalUseCase.toLowerCase());
      const roads = ((r as unknown as Record<string, unknown>).road_access ?? []) as string[];
      const matchRoad = !nationalRoadAccess || roads.some(rd => rd.toLowerCase().includes(nationalRoadAccess.toLowerCase()));
      return matchSearch && matchUC && matchRoad;
    });
  }, [nationalBuyers, globalSearch, nationalUseCase, nationalRoadAccess]);

  const filteredActive = useMemo(() => {
    const q = globalSearch.toLowerCase();
    return activeBuyers.filter(r => {
      const name = getBuyerName(r).toLowerCase();
      const co = (r.profiles?.company_name ?? '').toLowerCase();
      const state = (r.target_state ?? '').toLowerCase();
      const uc = (r.use_case ?? '').toLowerCase();
      const matchSearch = !q || name.includes(q) || co.includes(q) || state.includes(q) || uc.includes(q);
      const matchState = !activeStateFilter || state === activeStateFilter.toLowerCase();
      const matchUC = !activeUseCaseFilter || uc.includes(activeUseCaseFilter.toLowerCase());
      const roads = ((r as unknown as Record<string, unknown>).road_access ?? []) as string[];
      const matchRoad = !activeRoadAccess || roads.some(rd => rd.toLowerCase().includes(activeRoadAccess.toLowerCase()));
      return matchSearch && matchState && matchUC && matchRoad;
    });
  }, [activeBuyers, globalSearch, activeStateFilter, activeUseCaseFilter, activeRoadAccess]);

  const filteredBR = useMemo(() => {
    return buyerRequests.filter(r => {
      const q = brSearch.toLowerCase();
      const state = (r.target_state ?? '').toLowerCase();
      const regions = (r.target_regions ?? []).join(' ').toLowerCase();
      const uc = (r.use_case ?? '').toLowerCase();
      const matchSearch = !q || state.includes(q) || regions.includes(q) || uc.includes(q);
      const matchBudget = applyBudgetFilter(r, filterBudget);
      const matchAcreage = applyAcreageFilter(r, filterAcreage);
      const matchZoning = !filterZoning || (r.zoning_preference ?? []).some(z => z.toLowerCase().includes(filterZoning));
      const matchUC = !filterUseCase || uc.includes(filterUseCase);
      const matchTimeline = !filterTimeline || (r.timeline ?? '').includes(filterTimeline);
      const roads = ((r as unknown as Record<string, unknown>).road_access ?? []) as string[];
      const matchRoad = !filterRoadAccessBR || roads.some(rd => rd.toLowerCase().includes(filterRoadAccessBR.toLowerCase()));
      return matchSearch && matchBudget && matchAcreage && matchZoning && matchUC && matchTimeline && matchRoad;
    });
  }, [buyerRequests, brSearch, filterBudget, filterAcreage, filterZoning, filterUseCase, filterTimeline, filterRoadAccessBR]);

  // ── Helpers ──

  function openView(v: DirectoryView) {
    setGlobalSearch('');
    setView(v);
  }

  function backToGrid() {
    setView('grid');
    setGlobalSearch('');
  }

  const searchPlaceholder = tab === 'requests'
    ? 'Search by state, county, or zip code...'
    : view === 'grid'
    ? 'Search buyers by name, company, state, or use case...'
    : view === 'national'
    ? 'Search buyers by name, company, state, or use case...'
    : view === 'active'
    ? 'Filter active buyers by name, company, or state...'
    : 'Search buyers by name, company, state, or use case...';

  const handleSearchChange = (val: string) => {
    setGlobalSearch(val);
    if (tab === 'requests') setBrSearch(val);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-surface text-on-surface min-h-screen">

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-secondary hover:text-on-surface">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Upgrade to Contact Buyers</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Direct buyer contact requires a Priority or Exclusive plan. Upgrade to see full contact details and message buyers directly.
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

      <main className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-1">Buyer Directory</h1>
            <p className="text-secondary text-sm">Connect with verified land buyers actively seeking properties across the US.</p>
          </div>

          {/* Search bar */}
          <div className="relative mb-5">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl pointer-events-none">search</span>
            <input
              type="text"
              value={tab === 'requests' ? brSearch : globalSearch}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-white border border-outline-variant/25 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-on-surface placeholder:text-secondary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
            />
            {(tab === 'requests' ? brSearch : globalSearch) && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>

          {/* Tab toggle */}
          <div className="flex items-center gap-1 bg-surface-container-low rounded-2xl p-1 w-fit mb-8">
            {(['directory', 'requests'] as MainTab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setView('grid'); setGlobalSearch(''); setBrSearch(''); }}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  tab === t
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                {t === 'directory' ? 'Buyer Directory' : 'Buyer Requests'}
              </button>
            ))}
          </div>

          {/* ── DIRECTORY TAB ── */}
          {tab === 'directory' && (
            <>
              {/* Grid view — 3 category cards */}
              {view === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Top National Buyers */}
                  <button
                    onClick={() => openView('national')}
                    className="group bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-8 text-left hover:border-primary/30 hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="w-14 h-14 bg-primary/8 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/12 transition-colors">
                      <span className="material-symbols-outlined text-primary text-3xl">language</span>
                    </div>
                    <h3 className="font-headline text-xl font-extrabold text-primary mb-2">Top National Buyers</h3>
                    <p className="text-secondary text-sm leading-relaxed mb-6">
                      Browse the highest-volume land buyers actively purchasing across the US
                    </p>
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      Browse buyers
                      <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </button>

                  {/* Card 2: Top Buyers by State */}
                  <button
                    onClick={() => openView('by-state')}
                    className="group bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-8 text-left hover:border-primary/30 hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="w-14 h-14 bg-primary/8 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/12 transition-colors">
                      <span className="material-symbols-outlined text-primary text-3xl">map</span>
                    </div>
                    <h3 className="font-headline text-xl font-extrabold text-primary mb-2">Top Buyers by State</h3>
                    <p className="text-secondary text-sm leading-relaxed mb-6">
                      Find the most active buyers in any state
                    </p>
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      Select a state
                      <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </button>

                  {/* Card 3: Active Buyers */}
                  <button
                    onClick={() => openView('active')}
                    className="group bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-8 text-left hover:border-primary/30 hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
                      <span className="material-symbols-outlined text-emerald-700 text-3xl">bolt</span>
                    </div>
                    <h3 className="font-headline text-xl font-extrabold text-primary mb-2">Active Buyers</h3>
                    <p className="text-secondary text-sm leading-relaxed mb-6">
                      Buyers actively seeking land with a purchase timeline under 30 days
                    </p>
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      View active buyers
                      <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </button>
                </div>
              )}

              {/* National buyers view */}
              {view === 'national' && (
                <div>
                  <ViewHeader
                    title="Top National Buyers"
                    subtitle="Highest-volume land buyers ranked by budget, actively purchasing across the US"
                    count={filteredNational.length}
                    onBack={backToGrid}
                  />

                  {/* Filters row */}
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <select value={nationalUseCase} onChange={e => setNationalUseCase(e.target.value)} className={SELECT_CLS}>
                      <option value="">All Use Cases</option>
                      <option value="row crop">Row Crop</option>
                      <option value="livestock">Livestock/Ranching</option>
                      <option value="timber">Timber</option>
                      <option value="recreational">Recreational</option>
                      <option value="residential development">Residential Development</option>
                      <option value="commercial development">Commercial Development</option>
                      <option value="conservation">Conservation</option>
                      <option value="investment">Investment</option>
                    </select>
                    <select value={nationalRoadAccess} onChange={e => setNationalRoadAccess(e.target.value)} className={SELECT_CLS}>
                      <option value="">Road Access</option>
                      <option value="Paved Road">Paved Road</option>
                      <option value="Gravel Road">Gravel Road</option>
                      <option value="Dirt Road">Dirt Road</option>
                      <option value="Private Road">Private Road</option>
                      <option value="Easement">Easement</option>
                      <option value="No Road Access">No Road Access</option>
                    </select>
                    {(nationalUseCase || nationalRoadAccess) && (
                      <button onClick={() => { setNationalUseCase(''); setNationalRoadAccess(''); }} className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">close</span> Clear
                      </button>
                    )}
                  </div>

                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">
                    <span>Buyer</span>
                    <span className="w-24 text-right">State</span>
                    <span className="w-32 text-right">Budget</span>
                    <span className="w-28 text-right hidden lg:block">Use Case</span>
                  </div>

                  {nationalLoading ? (
                    <div className="space-y-3">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="bg-surface-container-low rounded-xl h-16 animate-pulse" />
                      ))}
                    </div>
                  ) : filteredNational.length === 0 ? (
                    <div className="text-center py-16 text-secondary">
                      <span className="material-symbols-outlined text-5xl mb-3 block text-primary/20">search_off</span>
                      <p className="font-semibold">No buyers found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredNational.map((req, i) => (
                        <div key={req.id} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-secondary/50 w-6 text-right shrink-0">{i + 1}</span>
                          <div className="flex-1">
                            <BuyerRow req={req} canViewContact={canViewContact} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* By-state view */}
              {view === 'by-state' && (
                <div>
                  <ViewHeader
                    title="Top Buyers by State"
                    subtitle="Find the most active buyers in any state, ranked by budget"
                    count={stateSearched ? stateBuyers.length : undefined}
                    onBack={backToGrid}
                  />

                  {/* State selector */}
                  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-6 mb-6">
                    <p className="text-sm font-semibold text-on-surface mb-3">Select a state to see top buyers</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={selectedState}
                        onChange={e => setSelectedState(e.target.value)}
                        className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                      >
                        <option value="">— Choose a state —</option>
                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button
                        onClick={() => loadStateBuyers(selectedState)}
                        disabled={!selectedState || stateLoading}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {stateLoading ? 'Searching…' : 'Show Top Buyers'}
                      </button>
                    </div>
                  </div>

                  {stateSearched && !stateLoading && (() => {
                    const filteredState = stateRoadAccess
                      ? stateBuyers.filter(r => {
                          const roads = ((r as unknown as Record<string, unknown>).road_access ?? []) as string[];
                          return roads.some(rd => rd.toLowerCase().includes(stateRoadAccess.toLowerCase()));
                        })
                      : stateBuyers;
                    return (
                      <>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <p className="text-sm text-secondary">
                            Showing top {filteredState.length} buyer{filteredState.length !== 1 ? 's' : ''} in <strong className="text-on-surface">{stateSearched}</strong>
                          </p>
                          <select value={stateRoadAccess} onChange={e => setStateRoadAccess(e.target.value)} className={SELECT_CLS}>
                            <option value="">Road Access</option>
                            <option value="Paved Road">Paved Road</option>
                            <option value="Gravel Road">Gravel Road</option>
                            <option value="Dirt Road">Dirt Road</option>
                            <option value="Private Road">Private Road</option>
                            <option value="Easement">Easement</option>
                            <option value="No Road Access">No Road Access</option>
                          </select>
                          {stateRoadAccess && (
                            <button onClick={() => setStateRoadAccess('')} className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">close</span> Clear
                            </button>
                          )}
                        </div>
                        {filteredState.length === 0 ? (
                          <div className="text-center py-16 text-secondary">
                            <span className="material-symbols-outlined text-5xl mb-3 block text-primary/20">location_off</span>
                            <p className="font-semibold">{stateBuyers.length === 0 ? `No buyers found in ${stateSearched}` : 'No buyers match these filters'}</p>
                            <p className="text-sm mt-1">Try a different state or clear your filters</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filteredState.map((req, i) => (
                              <div key={req.id} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-secondary/50 w-6 text-right shrink-0">{i + 1}</span>
                                <div className="flex-1">
                                  <BuyerRow req={req} canViewContact={canViewContact} showTimeline />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Active buyers view */}
              {view === 'active' && (
                <div>
                  <ViewHeader
                    title="Active Buyers"
                    subtitle='Buyers with a purchase timeline under 30 days — sorted by most recently posted'
                    count={filteredActive.length}
                    onBack={backToGrid}
                  />

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <select value={activeStateFilter} onChange={e => setActiveStateFilter(e.target.value)} className={SELECT_CLS}>
                      <option value="">All States</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={activeUseCaseFilter} onChange={e => setActiveUseCaseFilter(e.target.value)} className={SELECT_CLS}>
                      <option value="">All Use Cases</option>
                      <option value="row crop">Row Crop</option>
                      <option value="livestock">Livestock/Ranching</option>
                      <option value="timber">Timber</option>
                      <option value="recreational">Recreational</option>
                      <option value="residential development">Residential Development</option>
                      <option value="commercial development">Commercial Development</option>
                      <option value="conservation">Conservation</option>
                      <option value="investment">Investment</option>
                    </select>
                    <select value={activeRoadAccess} onChange={e => setActiveRoadAccess(e.target.value)} className={SELECT_CLS}>
                      <option value="">Road Access</option>
                      <option value="Paved Road">Paved Road</option>
                      <option value="Gravel Road">Gravel Road</option>
                      <option value="Dirt Road">Dirt Road</option>
                      <option value="Private Road">Private Road</option>
                      <option value="Easement">Easement</option>
                      <option value="No Road Access">No Road Access</option>
                    </select>
                    {(activeStateFilter || activeUseCaseFilter || activeRoadAccess) && (
                      <button onClick={() => { setActiveStateFilter(''); setActiveUseCaseFilter(''); setActiveRoadAccess(''); }} className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">close</span> Clear filters
                      </button>
                    )}
                  </div>

                  {activeLoading ? (
                    <div className="space-y-3">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="bg-surface-container-low rounded-xl h-16 animate-pulse" />
                      ))}
                    </div>
                  ) : filteredActive.length === 0 ? (
                    <div className="text-center py-16 text-secondary">
                      <span className="material-symbols-outlined text-5xl mb-3 block text-primary/20">hourglass_empty</span>
                      <p className="font-semibold">No active buyers match your filters</p>
                      <p className="text-sm mt-1">Try clearing your filters or check back soon</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredActive.map(req => (
                        <BuyerRow
                          key={req.id}
                          req={req}
                          canViewContact={canViewContact}
                          showTimeline={false}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── BUYER REQUESTS TAB ── */}
          {tab === 'requests' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-secondary text-sm">Active buyers looking for land that matches your listings</p>
                <button
                  onClick={() => { if (!tier && !isAdmin) { setShowUpgradeModal(true); return; } router.push('/create-buyer-request'); }}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Find a Property
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 py-4 border-y border-outline-variant/20 mb-6">
                <select value={filterBudget} onChange={e => setFilterBudget(e.target.value)} className={SELECT_CLS}>
                  <option value="">Budget Range</option>
                  <option value="under50k">Under $50K</option>
                  <option value="50k-100k">$50K–$100K</option>
                  <option value="100k-500k">$100K–$500K</option>
                  <option value="500k-1m">$500K–$1M</option>
                  <option value="1m-5m">$1M–$5M</option>
                  <option value="5m+">$5M+</option>
                </select>
                <select value={filterAcreage} onChange={e => setFilterAcreage(e.target.value)} className={SELECT_CLS}>
                  <option value="">Acreage Range</option>
                  <option value="under5">Under 5 acres</option>
                  <option value="5-25">5–25 acres</option>
                  <option value="25-100">25–100 acres</option>
                  <option value="100-500">100–500 acres</option>
                  <option value="500+">500+ acres</option>
                </select>
                <select value={filterZoning} onChange={e => setFilterZoning(e.target.value)} className={SELECT_CLS}>
                  <option value="">Zoning Type</option>
                  <option value="agricultural">Agricultural</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="mixed use">Mixed Use</option>
                  <option value="recreational">Recreational</option>
                  <option value="timber">Timber</option>
                  <option value="other">Other</option>
                </select>
                <select value={filterUseCase} onChange={e => setFilterUseCase(e.target.value)} className={SELECT_CLS}>
                  <option value="">Use Case</option>
                  <option value="row crop">Row Crop</option>
                  <option value="livestock">Livestock/Ranching</option>
                  <option value="timber">Timber</option>
                  <option value="recreational">Recreational</option>
                  <option value="residential development">Residential Development</option>
                  <option value="commercial development">Commercial Development</option>
                  <option value="conservation">Conservation</option>
                  <option value="investment">Investment</option>
                </select>
                <select value={filterTimeline} onChange={e => setFilterTimeline(e.target.value)} className={SELECT_CLS}>
                  <option value="">Timeline</option>
                  <option value="Actively Buying">Actively Buying</option>
                  <option value="1-3 months">1–3 months</option>
                  <option value="3-6 months">3–6 months</option>
                  <option value="6+ months">6+ months</option>
                </select>
                <select value={filterRoadAccessBR} onChange={e => setFilterRoadAccessBR(e.target.value)} className={SELECT_CLS}>
                  <option value="">Road Access</option>
                  <option value="Paved Road">Paved Road</option>
                  <option value="Gravel Road">Gravel Road</option>
                  <option value="Dirt Road">Dirt Road</option>
                  <option value="Private Road">Private Road</option>
                  <option value="Easement">Easement</option>
                  <option value="No Road Access">No Road Access</option>
                </select>
                {(filterBudget || filterAcreage || filterZoning || filterUseCase || filterTimeline || filterRoadAccessBR || brSearch) && (
                  <button
                    onClick={() => { setFilterBudget(''); setFilterAcreage(''); setFilterZoning(''); setFilterUseCase(''); setFilterTimeline(''); setFilterRoadAccessBR(''); setBrSearch(''); setGlobalSearch(''); }}
                    className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    Clear filters
                  </button>
                )}
              </div>

              {brLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-surface-container-low rounded-2xl p-6 animate-pulse space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-surface-container-high" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3 bg-surface-container-high rounded w-24" />
                          <div className="h-2 bg-surface-container-high rounded w-16" />
                        </div>
                      </div>
                      <div className="h-2 bg-surface-container-high rounded w-full" />
                      <div className="h-2 bg-surface-container-high rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : buyerRequests.length === 0 ? (
                <div className="text-center py-24 text-secondary">
                  <span className="material-symbols-outlined text-6xl mb-4 block text-primary/20">person_search</span>
                  <p className="font-headline text-2xl font-bold text-primary mb-2">No buyer requests yet</p>
                  <p className="text-sm mb-6">Be the first to post your buying criteria and connect with sellers</p>
                  <button
                    onClick={() => { if (!tier && !isAdmin) { setShowUpgradeModal(true); return; } router.push('/create-buyer-request'); }}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
                  >
                    Find a Property
                  </button>
                </div>
              ) : filteredBR.length === 0 ? (
                <div className="text-center py-16 text-secondary">
                  <span className="material-symbols-outlined text-5xl mb-4 block text-primary/20">filter_list_off</span>
                  <p className="font-headline text-xl font-bold text-primary mb-2">No results match your filters</p>
                  <p className="text-sm">Try adjusting your search or clearing filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBR.map(req => (
                    <BuyerRequestCard
                      key={req.id}
                      req={req}
                      canViewContact={canViewContact}
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}
