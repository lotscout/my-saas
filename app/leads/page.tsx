'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { PageHeader, PrimaryLink, SurfaceCard } from '@/components/ui/LotScoutUI';
import { getBuyerName } from '@/lib/getBuyerName';
import { STATE_MAP, resolveStateQuery } from '@/lib/stateMap';

type BuyerLead = {
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
  lot_size_min: number | null;
  lot_size_max: number | null;
  lot_size_label: string | null;
  use_case: string | null;
  zoning_preference: string[] | null;
  timeline: string | null;
  additional_notes: string | null;
  display_name: string | null;
  display_company: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_website: string | null;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    avatar_url: string | null;
  } | null;
};

const SELECT_CLS = 'bg-white px-4 py-3 rounded-xl border border-outline-variant/25 hover:border-primary/30 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all shadow-sm';

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

function fmtBudget(min: number | null, max: number | null): string {
  const f = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;
  if (min && max) return `${f(min)} – ${f(max)}`;
  if (min) return `${f(min)}+`;
  if (max) return `Up to ${f(max)}`;
  return 'Flexible';
}

function fmtTimeline(t: string | null): string {
  if (!t) return 'Flexible';
  if (/60/i.test(t)) return '60 days';
  if (/90/i.test(t)) return '90 days';
  if (/n\/?a|not applicable/i.test(t)) return 'N/A';
  return t;
}

function fmtDate(value: string | null): string {
  if (!value) return 'Not listed';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not listed';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function leadTitle(req: BuyerLead): string {
  const city = req.target_city || req.target_county || req.target_regions?.[0] || 'Market';
  const state = req.target_state ? (STATE_ABBREV[req.target_state.toLowerCase()] ?? req.target_state) : '';
  const place = state ? `${city}, ${state}` : city;
  const size = fmtLotSize(req);
  if (size && size !== 'Flexible') return `${size} in ${place}`;
  return `Land opportunity in ${place}`;
}

function fmtLocation(req: BuyerLead): string {
  if (req.target_regions?.length) return req.target_regions.join(', ');
  const abbrev = req.target_state ? (STATE_ABBREV[req.target_state.toLowerCase()] ?? null) : null;
  if (req.target_city && req.target_state) return `${req.target_city}, ${abbrev ?? req.target_state}`;
  if (req.target_county && req.target_state) return `${req.target_county} County, ${abbrev ?? req.target_state}`;
  return req.target_state || 'Market not specified';
}

function fmtLotSize(req: BuyerLead): string {
  if (req.lot_size_label) return req.lot_size_label;
  const min = req.min_acreage ?? req.lot_size_min;
  const max = req.max_acreage ?? req.lot_size_max;
  const f = (n: number) => `${Number.isInteger(n) ? n : Number(n.toFixed(1))} acres`;
  if (min && max) return `${f(min)} – ${f(max)}`;
  if (min) return `${f(min)}+`;
  if (max) return `Up to ${f(max)}`;
  return 'Flexible';
}

function fmtZoning(zoning: string[] | null): string {
  if (!zoning?.length) return 'Open';
  return zoning.slice(0, 2).join(', ');
}

function applyBudgetFilter(req: BuyerLead, f: string): boolean {
  const max = req.budget_max ?? 0;
  const min = req.budget_min ?? 0;
  if (!f) return true;
  if (f === 'under100k') return max > 0 && max < 100_000;
  if (f === '100k-500k') return max >= 100_000 && max < 500_000;
  if (f === '500k-1m') return max >= 500_000 && max < 1_000_000;
  if (f === '1m+') return (max || min) >= 1_000_000;
  return true;
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: string }) {
  return (
    <SurfaceCard className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-secondary/70">{label}</p>
          <p className="mt-1 font-headline text-3xl font-extrabold text-primary tracking-tight">{value}</p>
          <p className="mt-1 text-xs font-semibold text-secondary">{sub}</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl text-[#1D9E75]">{icon}</span>
        </div>
      </div>
    </SurfaceCard>
  );
}

function LeadCard({ lead }: { lead: BuyerLead }) {
  const name = getBuyerName(lead);
  const company = lead.display_company?.trim();
  const showCompany = !!company && company.toLowerCase() !== name.trim().toLowerCase();
  const title = leadTitle(lead);
  const postedDate = fmtDate(lead.created_at);

  return (
    <Link
      href={`/buyer-requests/${lead.id}`}
      className="group relative bg-white rounded-2xl border border-outline-variant/15 p-5 flex flex-col gap-4 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200 ring-1 ring-black/[0.02]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-headline text-xl font-extrabold text-primary leading-tight line-clamp-2">{title}</h3>
          <p className="mt-2 text-sm font-semibold text-secondary truncate">
            Listed by {showCompany ? company : name}
          </p>
        </div>
        <span className="material-symbols-outlined text-xl text-primary/60 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {[
          ['Price', fmtBudget(lead.budget_min, lead.budget_max)],
          ['Lot Size', fmtLotSize(lead)],
          ['Date Listed', postedDate],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white border border-outline-variant/20 px-3 py-2 shadow-sm">
            <p className="text-[10px] font-black text-secondary/70 uppercase tracking-wider leading-none">{label}</p>
            <p className="mt-1 text-sm font-extrabold text-primary truncate">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-surface-container-low border border-outline-variant/15 px-3 py-1 text-xs font-bold text-secondary">{fmtLocation(lead)}</span>
        <span className="rounded-full bg-surface-container-low border border-outline-variant/15 px-3 py-1 text-xs font-bold text-secondary">{fmtTimeline(lead.timeline)}</span>
        {lead.use_case && <span className="rounded-full bg-surface-container-low border border-outline-variant/15 px-3 py-1 text-xs font-bold text-secondary truncate max-w-full">{lead.use_case}</span>}
      </div>

      <p className="mt-auto border-t border-outline-variant/15 pt-3 text-xs font-semibold text-secondary leading-relaxed">
        Click to view seller/poster details, contact options, and the full lead criteria.
      </p>
    </Link>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-outline-variant/15 p-5 min-h-[260px] animate-pulse">
          <div className="h-6 w-28 rounded-full bg-surface-container-high mb-5" />
          <div className="h-5 w-40 rounded-full bg-surface-container-high mb-3" />
          <div className="grid grid-cols-2 gap-2 mt-6">
            <div className="h-14 rounded-xl bg-surface-container-low" />
            <div className="h-14 rounded-xl bg-surface-container-low" />
            <div className="h-14 rounded-xl bg-surface-container-low" />
            <div className="h-14 rounded-xl bg-surface-container-low" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<BuyerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/buyer-directory?status=active&limit=200', { cache: 'no-store' })
      .then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || 'Could not load leads');
        setLeads((json.requests ?? []) as BuyerLead[]);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load leads'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const stateVals = state ? resolveStateQuery(state).map(v => v.toLowerCase()) : null;
    return leads.filter(lead => {
      const name = getBuyerName(lead).toLowerCase();
      const company = (lead.display_company ?? '').toLowerCase();
      const market = [lead.target_city, lead.target_county, lead.target_state, ...(lead.target_regions ?? [])].filter(Boolean).join(' ').toLowerCase();
      const useCase = (lead.use_case ?? '').toLowerCase();
      const storedState = (lead.target_state ?? '').toLowerCase();
      const matchSearch = !q || name.includes(q) || company.includes(q) || market.includes(q) || useCase.includes(q);
      const matchState = !stateVals || stateVals.some(v => storedState === v);
      return matchSearch && matchState && applyBudgetFilter(lead, budget);
    });
  }, [leads, search, state, budget]);

  const nationalMarkets = useMemo(() => new Set(leads.map(l => l.target_state).filter(Boolean)).size, [leads]);

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Header />
      <main className="pt-24 px-4 sm:px-6 md:px-10 pb-20 min-h-screen max-w-[1440px] mx-auto">
        <PageHeader
          title={<>Land <span className="text-[#1D9E75]">Leads</span></>}
          description="Browse active land opportunities and submitted property leads. Click any card to see who listed it, contact details, pricing guidance, lot size, date listed, and full criteria."
          actions={(
            <PrimaryLink href="/create-buyer-request" className="rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Submit Buy Box
            </PrimaryLink>
          )}
        />

        <div className="mb-7 rounded-[1.75rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl text-amber-800">info</span>
              </div>
              <div>
                <p className="font-headline text-lg font-extrabold text-primary">Lead board, not the marketplace</p>
                <p className="mt-1 text-sm text-secondary leading-relaxed max-w-3xl">
                  Leads show buyer demand, target markets, budgets, and acquisition preferences. For approved land listings, use the Marketplace. Treat every lead as an introduction opportunity that still needs verification.
                </p>
              </div>
            </div>
            <Link href="/marketplace" className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant/25 bg-white px-4 py-3 text-sm font-extrabold text-primary hover:bg-surface-container-low transition-colors shrink-0">
              View Marketplace
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
          <StatCard label="Active leads" value={loading ? '—' : leads.length.toLocaleString()} sub="Property lead records" icon="person_search" />
          <StatCard label="Markets" value={loading ? '—' : nationalMarkets.toLocaleString()} sub="States represented" icon="travel_explore" />
          <StatCard label="Lead type" value="Property" sub="Seller and acquisition leads" icon="hub" />
        </div>

        <SurfaceCard className="p-3 sm:p-4 mb-7">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl pointer-events-none">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by property, seller, company, market, or use case"
                className="w-full bg-white border-2 border-primary/25 rounded-xl pl-12 pr-4 py-3 text-sm font-medium text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 transition-all shadow-inner"
              />
            </div>
            <select value={state} onChange={e => setState(e.target.value)} className={SELECT_CLS}>
              <option value="">All States</option>
              {Object.keys(STATE_MAP).sort().map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={budget} onChange={e => setBudget(e.target.value)} className={SELECT_CLS}>
              <option value="">All Budgets</option>
              <option value="under100k">Under $100K</option>
              <option value="100k-500k">$100K–$500K</option>
              <option value="500k-1m">$500K–$1M</option>
              <option value="1m+">$1M+</option>
            </select>
            {(search || state || budget) && (
              <button
                onClick={() => { setSearch(''); setState(''); setBudget(''); }}
                className="rounded-xl px-4 py-3 text-xs font-extrabold text-secondary hover:text-primary hover:bg-surface-container-low transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </SurfaceCard>

        {error ? (
          <SurfaceCard className="p-10 text-center">
            <p className="font-headline text-xl font-extrabold text-primary mb-2">Could not load leads</p>
            <p className="text-sm text-secondary mb-5">{error === 'Unauthorized' ? 'Sign in to view LotScout leads.' : error}</p>
            {error === 'Unauthorized' && <PrimaryLink href="/sign-in?redirect=/leads">Sign In</PrimaryLink>}
          </SurfaceCard>
        ) : loading ? (
          <LoadingGrid />
        ) : filtered.length === 0 ? (
          <SurfaceCard className="p-14 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-4xl text-primary/45">filter_list_off</span>
            </div>
            <p className="font-headline text-2xl font-extrabold text-primary mb-2">No leads match your filters</p>
            <p className="text-base text-secondary max-w-md mx-auto">Try clearing filters or widening the market to see more active buyer demand.</p>
          </SurfaceCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(lead => <LeadCard key={lead.id} lead={lead} />)}
          </div>
        )}
      </main>
    </div>
  );
}
