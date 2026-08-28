'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { PageHeader, SurfaceCard } from '@/components/ui/LotScoutUI';
import { MOCK_PROPERTY_LEADS, formatLeadDate, formatLeadPrice, type PropertyLead } from '@/lib/mockPropertyLeads';
import { STATE_MAP, resolveStateQuery } from '@/lib/stateMap';

const SELECT_CLS = 'bg-white px-4 py-3 rounded-xl border border-outline-variant/25 hover:border-primary/30 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all shadow-sm';

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: string }) {
  return (
    <SurfaceCard className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.12em] text-secondary/80">{label}</p>
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

function LeadCard({ lead }: { lead: PropertyLead }) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="group relative bg-white rounded-2xl border border-outline-variant/15 p-5 flex flex-col gap-4 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200 ring-1 ring-black/[0.02]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-headline text-xl font-extrabold text-primary leading-tight line-clamp-2">{lead.title}</h3>
          <p className="mt-2 text-sm font-semibold text-secondary truncate">Listed by {lead.sellerCompany}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-3">
        {[
          ['Price', formatLeadPrice(lead.price)],
          ['Lot Size', lead.lotSize],
          ['Date Listed', formatLeadDate(lead.listedDate)],
        ].map(([label, value]) => (
          <div key={label} className="min-w-[92px]">
            <p className="text-[10px] font-black text-secondary/65 uppercase tracking-wider leading-none">{label}</p>
            <p className="mt-1 text-sm font-extrabold text-primary truncate">{value}</p>
          </div>
        ))}
      </div>

    </Link>
  );
}

function applyBudgetFilter(lead: PropertyLead, filter: string): boolean {
  if (!filter) return true;
  if (filter === 'under100k') return lead.price < 100_000;
  if (filter === '100k-500k') return lead.price >= 100_000 && lead.price < 500_000;
  if (filter === '500k-1m') return lead.price >= 500_000 && lead.price < 1_000_000;
  if (filter === '1m+') return lead.price >= 1_000_000;
  return true;
}

function fmtAverage(value: number): string {
  if (!value) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value / 1000)}K`;
}

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [budget, setBudget] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const stateVals = state ? resolveStateQuery(state).map(v => v.toLowerCase()) : null;
    return MOCK_PROPERTY_LEADS.filter(lead => {
      const haystack = [lead.title, lead.city, lead.state, lead.county, lead.sellerName, lead.sellerCompany, lead.source, lead.propertyType, lead.zoning].join(' ').toLowerCase();
      const matchSearch = !q || haystack.includes(q);
      const matchState = !stateVals || stateVals.some(v => lead.state.toLowerCase() === v || lead.state.toLowerCase() === v.slice(0, 2));
      return matchSearch && matchState && applyBudgetFilter(lead, budget);
    });
  }, [search, state, budget]);

  const markets = useMemo(() => new Set(MOCK_PROPERTY_LEADS.map(lead => lead.state)).size, []);
  const averageLeadValue = useMemo(() => MOCK_PROPERTY_LEADS.reduce((sum, lead) => sum + lead.price, 0) / MOCK_PROPERTY_LEADS.length, []);

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Header />
      <main className="pt-24 px-4 sm:px-6 md:px-10 pb-20 min-h-screen max-w-[1440px] mx-auto">
        <PageHeader
          title={<>Land <span className="text-[#1D9E75]">Leads</span></>}
          description="Browse sample property leads sourced from public land-listing patterns across Zillow, Redfin, and Land.com. These mockups show how real seller/opportunity leads should appear inside LotScout."
          actions={(
            <Link href="/create-listing" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#1D9E75] bg-white px-4 py-3 text-sm font-extrabold text-[#1D9E75] hover:bg-[#EAF6F1] transition-colors">
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Submit Property Lead
            </Link>
          )}
        />

        <div className="mb-7 rounded-[1.75rem] border-2 border-[#1D9E75] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl bg-[#EAF6F1] border border-[#1D9E75]/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl text-[#1D9E75]">info</span>
              </div>
              <div>
                <p className="font-headline text-lg font-extrabold text-primary">Property leads, not approved marketplace listings</p>
                <p className="mt-1 text-sm text-secondary leading-relaxed max-w-3xl">
                  Leads are raw opportunities found from public land marketplaces or submitted by sellers. Verify ownership, availability, zoning, utilities, title, and price before treating any lead as actionable.
                </p>
              </div>
            </div>
            <Link href="/marketplace" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#1D9E75] bg-white px-4 py-3 text-sm font-extrabold text-[#1D9E75] hover:bg-[#EAF6F1] transition-colors shrink-0">
              View Marketplace
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
          <StatCard label="Active leads" value={MOCK_PROPERTY_LEADS.length.toLocaleString()} sub="Sample property leads" icon="real_estate_agent" />
          <StatCard label="Markets" value={markets.toLocaleString()} sub="States represented" icon="travel_explore" />
          <StatCard label="Average lead value" value={fmtAverage(averageLeadValue)} sub="Based on asking prices" icon="paid" />
        </div>

        <SurfaceCard className="p-3 sm:p-4 mb-7">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl pointer-events-none">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by property, seller, source, market, or zoning"
                className="w-full bg-white border-2 border-primary/25 rounded-xl pl-12 pr-4 py-3 text-sm font-medium text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 transition-all shadow-inner"
              />
            </div>
            <select value={state} onChange={e => setState(e.target.value)} className={SELECT_CLS}>
              <option value="">All States</option>
              {Object.keys(STATE_MAP).sort().map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={budget} onChange={e => setBudget(e.target.value)} className={SELECT_CLS}>
              <option value="">All Prices</option>
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

        {filtered.length === 0 ? (
          <SurfaceCard className="p-14 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-4xl text-primary/45">filter_list_off</span>
            </div>
            <p className="font-headline text-2xl font-extrabold text-primary mb-2">No leads match your filters</p>
            <p className="text-base text-secondary max-w-md mx-auto">Try clearing filters or widening the market to see more property opportunities.</p>
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
