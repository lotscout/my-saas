'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { STATE_MAP, resolveStateQuery } from '@/lib/stateMap';
import { getBuyerName } from '@/lib/getBuyerName';

// ─── Types ────────────────────────────────────────────────────────────────────

type MainTab = 'directory' | 'requests';
type DirectoryView = 'national' | 'by-state' | 'active';

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
  target_cities: string | null;
  lot_size_min: number | null;
  lot_size_max: number | null;
  lot_size_label: string | null;
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

const SELECT_CLS = 'bg-white px-4 py-3 rounded-xl border border-outline-variant/25 hover:border-primary/30 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all shadow-sm';
const FILTER_BAR_CLS = 'bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-4 flex flex-wrap items-center gap-3 mb-7';

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
  if (/60/i.test(t)) return '60 days';
  if (/90/i.test(t)) return '90 days';
  if (/n\/?a|not applicable|flexible/i.test(t)) return 'N/A';
  if (/actively buying|0.30 days|1.3 month/i.test(t)) return '60 days';
  if (/3.6 month|6\+ month/i.test(t)) return '90 days';
  return t;
}


// First city from the comma-separated target_cities list (falls back to target_city).
function primaryCity(req: { target_cities?: string | null; target_city?: string | null }): string | null {
  const first = (req.target_cities ?? '').split(',')[0]?.trim();
  return first || req.target_city || null;
}

function fmtLocation(city: string | null, county: string | null, state: string | null, regions?: string[] | null): string {
  if (regions?.length) return regions.join(', ');
  const abbrev = state ? (STATE_ABBREV[state.toLowerCase()] ?? null) : null;
  if (city && state) return `${city}, ${abbrev ?? state}`;
  if (county && state) return `${county} County, ${abbrev ?? state}`;
  return state || 'Location not specified';
}

function fmtZoning(zoning: string[] | null): string {
  if (!zoning?.length) return 'Any zoning';
  return zoning.slice(0, 2).join(', ');
}

function fmtLotSize(req: BuyerRequest): string {
  if (req.lot_size_label) return req.lot_size_label;
  const min = req.min_acreage ?? req.lot_size_min;
  const max = req.max_acreage ?? req.lot_size_max;
  const f = (n: number) => `${Number.isInteger(n) ? n : Number(n.toFixed(1))} acres`;
  if (min && max) return `${f(min)} – ${f(max)}`;
  if (min) return `${f(min)}+`;
  if (max) return `Up to ${f(max)}`;
  return 'Flexible';
}

function DetailGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 border-y border-outline-variant/20 py-2">
      {items.map(item => (
        <div key={item.label} className="min-w-0 rounded-lg bg-emerald-50/60 border border-emerald-100 px-2 py-1.5 text-center">
          <p className="text-[10px] font-black text-emerald-800/70 uppercase tracking-wider leading-none">{item.label}</p>
          <p className="text-[13px] font-extrabold text-primary mt-1 truncate leading-tight">{item.value}</p>
        </div>
      ))}
    </div>
  );
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

// ─── DirectoryCard — contact info only (Buyer Directory) ──────────────────────

function DirectoryCard({ req }: { req: BuyerRequest }) {
  const router = useRouter();
  const name = getBuyerName(req);
  const company = req.display_company?.trim();
  const showCompany = !!company && company.toLowerCase() !== name.trim().toLowerCase();
  const website = req.contact_website;
  const phone = req.contact_phone;
  const email = req.contact_email;
  const reachable = !!(phone || email);
  const location = fmtLocation(req.target_city, req.target_county, req.target_state, req.target_regions);
  const timeline = req.timeline ? fmtTimeline(req.timeline) : 'N/A';

  return (
    <div
      onClick={() => router.push(`/buyer-requests/${req.id}`)}
      className="group relative bg-white rounded-xl border border-emerald-100 p-4 flex flex-col gap-3 cursor-pointer hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-900/10 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden min-h-[165px] ring-1 ring-black/[0.02]"
    >
      <div className="min-w-0 text-center pr-5">
        <p className="font-headline font-extrabold text-primary text-xl leading-tight line-clamp-1">{name}</p>
        {showCompany && (
          <p className="text-sm font-semibold text-secondary truncate mt-1 mx-auto max-w-full">{company}</p>
        )}
      </div>

      <DetailGrid items={[
        { label: 'Budget', value: fmtBudget(req.budget_min, req.budget_max) },
        { label: 'Timeline', value: timeline },
        { label: 'Zoning', value: fmtZoning(req.zoning_preference) },
        { label: 'Location', value: location },
        { label: 'Lot Size', value: fmtLotSize(req) },
      ]} />

      {website && (
        <a
          href={`https://${website.replace(/^https?:\/\//, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary font-bold truncate"
        >
          <span className="material-symbols-outlined text-base">language</span>
          <span className="truncate">{website.replace(/^https?:\/\//, '')}</span>
        </a>
      )}
      {reachable ? (
        <div className="mt-auto space-y-0.5 border-t border-outline-variant/15 pt-2">
          {phone && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-secondary truncate">
              <span className="material-symbols-outlined text-base">call</span>{phone}
            </p>
          )}
          {email && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-secondary truncate">
              <span className="material-symbols-outlined text-base">mail</span>{email}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-auto text-xs font-semibold text-secondary/80 border-t border-outline-variant/15 pt-2">Contact via platform</p>
      )}
      <div className="absolute top-3 right-3 flex items-center justify-end text-sm">
        <span className="material-symbols-outlined text-xl text-emerald-600 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
      </div>
    </div>
  );
}

// ─── RequestCard — active-search criteria (Buyer Requests) ────────────────────

function RequestCard({ req }: { req: BuyerRequest }) {
  const router = useRouter();
  const name = getBuyerName(req);
  const company = req.display_company?.trim();
  const showCompany = !!company && company.toLowerCase() !== name.trim().toLowerCase();
  const location = fmtLocation(req.target_city, req.target_county, req.target_state, req.target_regions);
  const timeline = req.timeline ? fmtTimeline(req.timeline) : 'N/A';

  return (
    <div
      onClick={() => router.push(`/buyer-requests/${req.id}`)}
      className="group relative bg-white rounded-xl border border-emerald-100 p-4 flex flex-col gap-3 cursor-pointer hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-900/10 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden min-h-[155px] ring-1 ring-black/[0.02]"
    >
      <div className="min-w-0 border-b border-outline-variant/15 pb-2 text-center pr-5">
        <p className="font-headline font-extrabold text-primary text-xl leading-tight line-clamp-1">{name}</p>
        {showCompany && (
          <p className="text-sm font-semibold text-secondary truncate mt-1 mx-auto max-w-full">{company}</p>
        )}
      </div>
      <DetailGrid items={[
        { label: 'Budget', value: fmtBudget(req.budget_min, req.budget_max) },
        { label: 'Timeline', value: timeline },
        { label: 'Zoning', value: fmtZoning(req.zoning_preference) },
        { label: 'Location', value: location },
        { label: 'Lot Size', value: fmtLotSize(req) },
      ]} />
      <div className="absolute top-3 right-3 flex items-center justify-end text-sm">
        <span className="material-symbols-outlined text-xl text-emerald-600 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
      </div>
    </div>
  );
}

// ─── Premium landing card ────────────────────────────────────────────────────

function DirectoryHomeCard({ icon, title, description, action, accent = 'primary', onClick }: {
  icon: string;
  title: string;
  description: string;
  action: string;
  accent?: 'primary' | 'emerald';
  onClick: () => void;
}) {
  const emerald = accent === 'emerald';
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden bg-white rounded-[1.75rem] border border-outline-variant/15 p-8 text-left shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 active:scale-[0.99]"
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${emerald ? 'bg-emerald-500' : 'bg-primary'}`} />
      <div className="flex items-start justify-between gap-5 mb-8">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-colors ${emerald ? 'bg-white border-emerald-200' : 'bg-primary/8 border-transparent group-hover:bg-primary/12'}`}>
          <span className={`material-symbols-outlined text-4xl ${emerald ? 'text-emerald-700' : 'text-primary'}`}>{icon}</span>
        </div>
        <span className="material-symbols-outlined text-primary/30 group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
      </div>
      <h3 className="font-headline text-2xl font-extrabold text-primary mb-3 tracking-tight">{title}</h3>
      <p className="text-secondary text-base leading-relaxed mb-8 min-h-[78px]">{description}</p>
      <div className={`inline-flex items-center gap-2 text-sm font-extrabold ${emerald ? 'text-emerald-700' : 'text-primary'}`}>
        {emerald && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />}
        {action}
      </div>
    </button>
  );
}

function LoadingCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-outline-variant/15 p-6 animate-pulse min-h-[230px] shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-high" />
            <div className="space-y-3 flex-1 pt-1">
              <div className="h-4 bg-surface-container-high rounded-full w-36" />
              <div className="h-3 bg-surface-container-high rounded-full w-24" />
            </div>
          </div>
          <div className="rounded-xl bg-surface-container-low p-4 mb-5 space-y-3">
            <div className="h-3 bg-surface-container-high rounded-full w-20" />
            <div className="h-4 bg-surface-container-high rounded-full w-32" />
          </div>
          <div className="flex gap-2 mb-6">
            <div className="h-8 bg-surface-container-high rounded-full w-28" />
            <div className="h-8 bg-surface-container-high rounded-full w-20" />
          </div>
          <div className="h-px bg-surface-container-high mb-4" />
          <div className="h-3 bg-surface-container-high rounded-full w-32" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, subtitle, actionLabel, onAction }: {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="bg-white rounded-[1.75rem] border border-outline-variant/15 shadow-sm text-center py-16 px-6 text-secondary">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-4xl text-primary/45">{icon}</span>
      </div>
      <p className="font-headline text-2xl font-extrabold text-primary mb-2">{title}</p>
      <p className="text-base max-w-md mx-auto leading-relaxed">{subtitle}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary text-white px-5 py-3 text-sm font-extrabold hover:bg-primary/90 transition-colors">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── Sub-view back header ─────────────────────────────────────────────────────

function ViewHeader({ title, subtitle, count, onBack }: { title: string; subtitle: string; count?: number; onBack?: () => void }) {
  return (
    <div className="bg-white rounded-[1.75rem] border border-outline-variant/15 shadow-sm p-6 sm:p-7 flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-7">
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-secondary hover:text-primary text-sm font-bold mb-4 transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Directory
          </button>
        )}
        <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">{title}</h2>
        <p className="text-secondary text-base mt-2 max-w-2xl leading-relaxed">{subtitle}</p>
      </div>
      {count !== undefined && (
        <div className="bg-primary/8 text-primary px-5 py-3 rounded-2xl text-sm font-extrabold shrink-0 shadow-sm">
          {count} buyer{count !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BuyerDirectoryPage() {
  // ── Navigation state ──
  const [tab, setTab] = useState<MainTab>('directory');
  const [view] = useState<DirectoryView>('active');

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
  const [activeSort, setActiveSort] = useState<'newest' | 'oldest'>('newest');
  const [showActiveFilters, setShowActiveFilters] = useState(false);

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
    fetch(`/api/buyer-directory?status=active&state=${encodeURIComponent(state)}&limit=10`)
      .then(r => r.json())
      .then(({ requests }) => { setStateBuyers((requests ?? []) as BuyerRequest[]); setStateLoading(false); })
      .catch(() => setStateLoading(false));
  }

  useEffect(() => {
    if (view !== 'active') return;
    setActiveLoading(true);
    fetch('/api/buyer-directory?status=active&limit=200')
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
    const filtered = activeBuyers.filter(r => {
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
    return [...filtered].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return activeSort === 'oldest' ? diff : -diff;
    });
  }, [activeBuyers, activeBrSearch, activeBrState, activeBrBudget, activeBrAcreage, activeBrZoning, activeBrRoadAccess, activeSort]);

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
      const matchTimeline = !filterTimeline || fmtTimeline(r.timeline ?? 'N/A') === filterTimeline;
      const roads = ((r as unknown as Record<string, unknown>).road_access ?? []) as string[];
      const matchRoad = !filterRoadAccessBR || roads.some(rd => rd.toLowerCase().includes(filterRoadAccessBR.toLowerCase()));
      return matchSearch && matchBudget && matchAcreage && matchZoning && matchTimeline && matchRoad;
    });
  }, [buyerRequests, brSearch, filterBudget, filterAcreage, filterZoning, filterTimeline, filterRoadAccessBR]);

  // ── Helpers ──

  const handleSearchChange = (val: string) => {
    setGlobalSearch(val);
    if (tab === 'requests') setBrSearch(val);
    else setActiveBrSearch(val);
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

      <main className="pt-24 px-4 sm:px-6 md:px-10 pb-20 min-h-screen max-w-[1440px] mx-auto">

          {/* Page header */}
          <section className="mb-7 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="font-headline text-2xl sm:text-5xl font-extrabold text-primary tracking-tight leading-tight">Buyer Directory</h1>
              <p className="text-secondary text-base mt-2 max-w-2xl">Search active land buyers and review their acquisition criteria.</p>
            </div>
            <Link
              href="/create-buyer-request"
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-[#1D9E75] px-3 py-2 text-xs sm:px-5 sm:py-3 sm:text-sm font-extrabold text-white shadow-sm hover:bg-[#14795A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D9E75] md:shrink-0 self-start"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">add_circle</span>
              Create Request
            </Link>
          </section>

          {/* Search / sort / filter */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 shadow-sm p-3 sm:p-4 mb-7">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl pointer-events-none">search</span>
                <input
                  type="text"
                  value={tab === 'requests' ? brSearch : activeBrSearch}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder=""
                  aria-label="Search buyer directory"
                  className="w-full bg-white border-2 border-primary/25 rounded-xl pl-12 pr-10 py-3 text-sm font-medium text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 transition-all shadow-inner"
                />
                {(tab === 'requests' ? brSearch : activeBrSearch) && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
              </div>
              {tab === 'directory' && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveSort(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    aria-label={`Sort by ${activeSort === 'newest' ? 'oldest' : 'newest'}`}
                    title={activeSort === 'newest' ? 'Newest first' : 'Oldest first'}
                    className="shrink-0 inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-outline-variant/25 text-primary hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">sort</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowActiveFilters(prev => !prev)}
                    aria-label="Filter buyer directory"
                    title="Filter"
                    className="relative shrink-0 inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-outline-variant/25 text-primary hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">tune</span>
                    {(activeBrState || activeBrBudget || activeBrAcreage || activeBrZoning || activeBrRoadAccess) && (
                      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#1D9E75] ring-2 ring-white" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── DIRECTORY TAB ── */}
          {tab === 'directory' && (
            <>
              {/* Active buyers view */}
              {view === 'active' && (
                <div>
                  {/* Filters */}
                  {showActiveFilters && (
                  <div className={FILTER_BAR_CLS}>
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
                  )}

                  {activeLoading ? (
                    <LoadingCardGrid />
                  ) : filteredActiveBR.length === 0 ? (
                    <EmptyState
                      icon="hourglass_empty"
                      title="No active buyers match your filters"
                      subtitle="Clear your filters or check back soon for buyers with fresh purchase intent."
                      actionLabel="Clear filters"
                      onAction={() => { setActiveBrState(''); setActiveBrBudget(''); setActiveBrAcreage(''); setActiveBrZoning(''); setActiveBrRoadAccess(''); setActiveBrSearch(''); }}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredActiveBR.map(req => (
                        <RequestCard key={req.id} req={req} />
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
              <div className={FILTER_BAR_CLS}>
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
                  <option value="60 days">60 days</option>
                  <option value="90 days">90 days</option>
                  <option value="N/A">N/A</option>
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
                <LoadingCardGrid />
              ) : buyerRequests.length === 0 ? (
                <EmptyState
                  icon="person_search"
                  title="No buyer requests yet"
                  subtitle="Be the first to post buying criteria and connect with motivated sellers."
                />
              ) : filteredBR.length === 0 ? (
                <EmptyState
                  icon="filter_list_off"
                  title="No results match your filters"
                  subtitle="Try clearing filters or broadening your search to see more active buyer requests."
                  actionLabel="Clear filters"
                  onAction={() => { setFilterBudget(''); setFilterAcreage(''); setFilterZoning(''); setFilterTimeline(''); setFilterRoadAccessBR(''); setBrSearch(''); setGlobalSearch(''); }}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredBR.map(req => (
                    <RequestCard key={req.id} req={req} />
                  ))}
                </div>
              )}
            </>
          )}

      </main>
    </div>
  );
}
