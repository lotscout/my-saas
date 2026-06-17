'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useUserTier } from '@/hooks/useUserTier';
import { STATE_MAP, resolveStateQuery } from '@/lib/stateMap';
import { getBuyerName } from '@/lib/getBuyerName';

// ─── Types ────────────────────────────────────────────────────────────────────

type MainTab = 'directory' | 'requests';
type DirectoryView = 'grid' | 'national' | 'by-state' | 'active';

interface BuyerRequest {
  id: string;
  user_id: string;
  status: string;
  target_state: string | null;
  target_county: string | null;
  target_city: string | null;
  target_regions: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  min_acreage: number | null;
  max_acreage: number | null;
  use_case: string | null;
  zoning_preference: string[] | null;
  timeline: string | null;
  additional_notes: string | null;
  first_name?: string | null;
  last_name?: string | null;
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

const STATE_ABBREV: Record<string, string> = {
  'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA',
  'colorado':'CO','connecticut':'CT','delaware':'DE','florida':'FL','georgia':'GA',
  'hawaii':'HI','idaho':'ID','illinois':'IL','indiana':'IN','iowa':'IA','kansas':'KS',
  'kentucky':'KY','louisiana':'LA','maine':'ME','maryland':'MD','massachusetts':'MA',
  'michigan':'MI','minnesota':'MN','mississippi':'MS','missouri':'MO','montana':'MT',
  'nebraska':'NE','nevada':'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM',
  'new york':'NY','north carolina':'NC','north dakota':'ND','ohio':'OH','oklahoma':'OK',
  'oregon':'OR','pennsylvania':'PA','rhode island':'RI','south carolina':'SC',
  'south dakota':'SD','tennessee':'TN','texas':'TX','utah':'UT','vermont':'VT',
  'virginia':'VA','washington':'WA','west virginia':'WV','wisconsin':'WI','wyoming':'WY',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBudget(min: number | null, max: number | null): string {
  const f = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;
  if (min && max) return `${f(min)} – ${f(max)}`;
  if (min) return `${f(min)}+`;
  if (max) return `Up to ${f(max)}`;
  return 'Flexible';
}

function fmtPerAcre(budgetMax: number | null, minAcreage: number | null, budgetMin: number | null): string {
  const budget = budgetMax ?? budgetMin;
  if (!budget || !minAcreage || minAcreage <= 0) return fmtBudget(budgetMin, budgetMax);
  if (minAcreage < 10000 / 43560) {
    const perSqFt = budget / (minAcreage * 43560);
    return `$${Math.round(perSqFt).toLocaleString()}/sq ft`;
  }
  return `$${Math.round(budget / minAcreage).toLocaleString()}/acre`;
}

function fmtTimeline(t: string): string {
  if (/actively buying|0.30 days/i.test(t)) return 'Under 30 days';
  if (/1.3 month/i.test(t)) return '1–3 months';
  if (/3.6 month/i.test(t)) return '3–6 months';
  if (/flexible|6\+/i.test(t)) return 'Flexible';
  return t;
}


function getInitials(req: BuyerRequest): string {
  const name = getBuyerName(req);
  if (name === 'Anonymous Buyer') return 'AB';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'AB';
}

function fmtLocation(city: string | null, county: string | null, state: string | null, regions?: string[] | null): string {
  if (regions?.length) return regions.join(', ');
  const abbrev = state ? (STATE_ABBREV[state.toLowerCase()] ?? null) : null;
  if (city && state) return `${city}, ${abbrev ?? state}`;
  if (county && state) return `${county} County, ${abbrev ?? state}`;
  return state || 'Location not specified';
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
  minimal?: boolean;
}

function BuyerRow({ req, canViewContact, showTimeline = true, minimal = false }: BuyerRowProps) {
  const name = getBuyerName(req);
  const initials = getInitials(req);
  const company = req.display_company || req.profiles?.company_name || null;
  const blur = !canViewContact;

  if (minimal) {
    return (
      <Link
        href={`/buyer-requests/${req.id}`}
        className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 px-4 py-3 flex items-center hover:shadow-md hover:border-primary/20 transition-all"
      >
        <div className="min-w-0">
          <p className={`font-bold text-primary text-sm truncate ${blur ? 'blur-sm select-none' : ''}`}>{name}</p>
          {company && (
            <p className={`text-xs text-secondary truncate ${blur ? 'blur-sm select-none' : ''}`}>{company}</p>
          )}
        </div>
      </Link>
    );
  }

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
          {company && (
            <p className={`text-xs text-secondary truncate ${blur ? 'blur-sm select-none' : ''}`}>{company}</p>
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
        <span className="flex items-center gap-1 text-secondary">
          <span className="material-symbols-outlined text-sm">location_on</span>
          {fmtLocation(req.target_city, req.target_county, req.target_state, req.target_regions)}
        </span>
        <span className="font-semibold text-on-surface">{fmtBudget(req.budget_min, req.budget_max)}</span>
        {req.use_case && (
          <span className="bg-primary/8 text-primary px-2 py-0.5 rounded-full font-bold capitalize">{req.use_case.split(' — ')[0]}</span>
        )}
        {showTimeline && req.timeline && (
          <span className="text-secondary hidden md:inline">{fmtTimeline(req.timeline)}</span>
        )}
      </div>
    </Link>
  );
}

// ─── BuyerRequestCard (for Requests tab) ──────────────────────────────────────

interface BuyerCardProps {
  req: BuyerRequest;
  canViewContact: boolean;
  onUpgradeClick?: () => void;
}

function BuyerRequestCard({ req, canViewContact, onUpgradeClick }: BuyerCardProps) {
  const location = fmtLocation(req.target_city, req.target_county, req.target_state, req.target_regions);
  const perAcre = fmtPerAcre(req.budget_max, req.min_acreage, req.budget_min);
  const timeline = req.timeline ? fmtTimeline(req.timeline) : null;
  const listedBy = getBuyerName(req);

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-4 flex flex-col hover:shadow-lg hover:border-primary/25 transition-all overflow-hidden">
      <div className="space-y-2">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-secondary/70">Location</p>
          <p className={`text-base font-bold ${location === 'Location not specified' ? 'text-secondary/50 italic' : 'text-on-surface'}`}>{location}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-secondary/70">Budget</p>
          <p className="text-base font-bold text-on-surface">{perAcre}</p>
        </div>
        {timeline && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-secondary/70">Timeline</p>
            <p className="text-base font-bold text-on-surface">{timeline}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-secondary italic mt-3">Listed by {listedBy}</p>

      <div className="flex gap-2 mt-3">
        {canViewContact ? (
          <Link
            href={`/buyer-requests/${req.id}`}
            className="w-1/2 bg-green-700 text-white text-sm font-semibold rounded-xl py-2 text-center hover:bg-green-800 transition-colors"
          >
            Contact Buyer
          </Link>
        ) : (
          <button
            onClick={onUpgradeClick}
            className="w-1/2 bg-green-700 text-white text-sm font-semibold rounded-xl py-2 hover:bg-green-800 transition-colors"
          >
            Contact Buyer
          </button>
        )}
        <Link
          href={`/buyer-requests/${req.id}`}
          className="w-1/2 border border-green-700 text-green-700 text-sm font-semibold rounded-xl py-2 text-center hover:bg-green-50 transition-colors"
        >
          See More
        </Link>
      </div>
    </div>
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
  const { isAdmin, isAtLeast, loading: permLoading } = useUserTier();

  const canViewContact = !permLoading && (isAtLeast('standard') || !!isAdmin);

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
  const [activeBrSearch, setActiveBrSearch] = useState('');
  const [activeBrState, setActiveBrState] = useState('');
  const [activeBrBudget, setActiveBrBudget] = useState('');
  const [activeBrAcreage, setActiveBrAcreage] = useState('');
  const [activeBrZoning, setActiveBrZoning] = useState('');
  const [activeBrRoadAccess, setActiveBrRoadAccess] = useState('');

  // ── Buyer requests tab ──
  const [buyerRequests, setBuyerRequests] = useState<BuyerRequest[]>([]);
  const [brLoading, setBrLoading] = useState(false);
  const [brSearch, setBrSearch] = useState('');
  const [filterBudget, setFilterBudget] = useState('');
  const [filterAcreage, setFilterAcreage] = useState('');
  const [filterZoning, setFilterZoning] = useState('');
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

  const filteredActiveBR = useMemo(() => {
    const stateVals = activeBrState
      ? resolveStateQuery(activeBrState).map(v => v.toLowerCase())
      : null;
    return activeBuyers.filter(r => {
      const q = activeBrSearch.toLowerCase();
      const stored = (r.target_state ?? '').toLowerCase();
      const city = (r.target_city ?? '').toLowerCase();
      const county = (r.target_county ?? '').toLowerCase();
      const uc = (r.use_case ?? '').toLowerCase();
      const matchSearch = !q || stored.includes(q) || city.includes(q) || county.includes(q) || uc.includes(q);
      const matchState = !stateVals || stateVals.some(v => stored === v);
      const matchBudget = applyBudgetFilter(r, activeBrBudget);
      const matchAcreage = applyAcreageFilter(r, activeBrAcreage);
      const matchZoning = !activeBrZoning || (r.zoning_preference ?? []).some(z => z.toLowerCase().includes(activeBrZoning));
      const roads = ((r as unknown as Record<string, unknown>).road_access ?? []) as string[];
      const matchRoad = !activeBrRoadAccess || roads.some(rd => rd.toLowerCase().includes(activeBrRoadAccess.toLowerCase()));
      return matchSearch && matchState && matchBudget && matchAcreage && matchZoning && matchRoad;
    });
  }, [activeBuyers, activeBrSearch, activeBrState, activeBrBudget, activeBrAcreage, activeBrZoning, activeBrRoadAccess]);

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
      const matchTimeline = !filterTimeline || (r.timeline ?? '').includes(filterTimeline);
      const roads = ((r as unknown as Record<string, unknown>).road_access ?? []) as string[];
      const matchRoad = !filterRoadAccessBR || roads.some(rd => rd.toLowerCase().includes(filterRoadAccessBR.toLowerCase()));
      return matchSearch && matchBudget && matchAcreage && matchZoning && matchTimeline && matchRoad;
    });
  }, [buyerRequests, brSearch, filterBudget, filterAcreage, filterZoning, filterTimeline, filterRoadAccessBR]);

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
      <Header />

      {/* Upgrade Modal */}
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
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Upgrade to Contact Buyers</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Direct buyer contact requires a paid LotScout account. Upgrade to see full contact details and message buyers directly.
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

      <main className="pt-24 px-4 sm:px-6 md:px-10 pb-20 min-h-screen max-w-[1400px] mx-auto">

          {/* Page header */}
          <section className="mb-8 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="max-w-2xl">
              <h1 className="font-headline text-2xl sm:text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight mb-4">
                Buyer <span className="text-emerald-600">Directory</span>
              </h1>
              <p className="text-slate-500 font-body text-lg leading-relaxed">
                Connect with verified land buyers actively seeking properties across the US.
              </p>
            </div>
          </section>

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
                      {filteredNational.map(req => (
                        <BuyerRow key={req.id} req={req} canViewContact={canViewContact} minimal />
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
                    subtitle="Buyers actively seeking land with a purchase timeline under 30 days"
                    count={filteredActiveBR.length}
                    onBack={backToGrid}
                  />

                  {/* Search bar */}
                  <div className="relative mb-5">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl pointer-events-none">search</span>
                    <input
                      type="text"
                      value={activeBrSearch}
                      onChange={e => setActiveBrSearch(e.target.value)}
                      placeholder="Search by state, county, or zip code..."
                      className="w-full bg-white border border-outline-variant/25 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-on-surface placeholder:text-secondary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    />
                    {activeBrSearch && (
                      <button onClick={() => setActiveBrSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface">
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    )}
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3 py-4 border-y border-outline-variant/20 mb-6">
                    <select value={activeBrState} onChange={e => setActiveBrState(e.target.value)} className={SELECT_CLS}>
                      <option value="" disabled hidden>State</option>
                      {Object.keys(STATE_MAP).sort().map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={activeBrBudget} onChange={e => setActiveBrBudget(e.target.value)} className={SELECT_CLS}>
                      <option value="" disabled hidden>Budget Range</option>
                      <option value="under50k">Under $50K</option>
                      <option value="50k-100k">$50K–$100K</option>
                      <option value="100k-500k">$100K–$500K</option>
                      <option value="500k-1m">$500K–$1M</option>
                      <option value="1m-5m">$1M–$5M</option>
                      <option value="5m+">$5M+</option>
                    </select>
                    <select value={activeBrAcreage} onChange={e => setActiveBrAcreage(e.target.value)} className={SELECT_CLS}>
                      <option value="" disabled hidden>Acreage Range</option>
                      <option value="under5">Under 5 acres</option>
                      <option value="5-25">5–25 acres</option>
                      <option value="25-100">25–100 acres</option>
                      <option value="100-500">100–500 acres</option>
                      <option value="500+">500+ acres</option>
                    </select>
                    <select value={activeBrZoning} onChange={e => setActiveBrZoning(e.target.value)} className={SELECT_CLS}>
                      <option value="" disabled hidden>Zoning Type</option>
                      <option value="agricultural">Agricultural</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="mixed use">Mixed Use</option>
                      <option value="recreational">Recreational</option>
                      <option value="other">Other</option>
                    </select>
                    <select value={activeBrRoadAccess} onChange={e => setActiveBrRoadAccess(e.target.value)} className={SELECT_CLS}>
                      <option value="" disabled hidden>Road Access</option>
                      <option value="Paved Road">Paved Road</option>
                      <option value="Gravel Road">Gravel Road</option>
                      <option value="Dirt Road">Dirt Road</option>
                      <option value="Private Road">Private Road</option>
                      <option value="Easement">Easement</option>
                      <option value="No Road Access">No Road Access</option>
                    </select>
                    {(activeBrState || activeBrBudget || activeBrAcreage || activeBrZoning || activeBrRoadAccess || activeBrSearch) && (
                      <button
                        onClick={() => { setActiveBrState(''); setActiveBrBudget(''); setActiveBrAcreage(''); setActiveBrZoning(''); setActiveBrRoadAccess(''); setActiveBrSearch(''); }}
                        className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        Clear filters
                      </button>
                    )}
                  </div>

                  {activeLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1,2,3].map(i => (
                        <div key={i} className="bg-surface-container-low rounded-2xl p-5 animate-pulse space-y-4">
                          <div className="h-4 bg-surface-container-high rounded w-32" />
                          <div className="h-3 bg-surface-container-high rounded w-24" />
                          <div className="mt-4 space-y-2">
                            <div className="h-2 bg-surface-container-high rounded w-full" />
                            <div className="h-2 bg-surface-container-high rounded w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredActiveBR.length === 0 ? (
                    <div className="text-center py-16 text-secondary">
                      <span className="material-symbols-outlined text-5xl mb-3 block text-primary/20">hourglass_empty</span>
                      <p className="font-semibold">No active buyers match your filters</p>
                      <p className="text-sm mt-1">Try clearing your filters or check back soon</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredActiveBR.map(req => (
                        <BuyerRequestCard key={req.id} req={req} canViewContact={canViewContact} onUpgradeClick={() => setShowUpgradeModal(true)} />
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
              <div className="mb-6">
                <p className="text-secondary text-sm">Active buyers looking for land that matches your listings</p>
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
                  <option value="other">Other</option>
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
                {(filterBudget || filterAcreage || filterZoning || filterTimeline || filterRoadAccessBR || brSearch) && (
                  <button
                    onClick={() => { setFilterBudget(''); setFilterAcreage(''); setFilterZoning(''); setFilterTimeline(''); setFilterRoadAccessBR(''); setBrSearch(''); setGlobalSearch(''); }}
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
                  <p className="text-sm">Be the first to post your buying criteria and connect with sellers</p>
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
                      onUpgradeClick={() => setShowUpgradeModal(true)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

      </main>
    </div>
  );
}
