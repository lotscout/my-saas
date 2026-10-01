'use client';

import { useEffect, useMemo, useState } from 'react';
import DenverVacantLotsMap, { type DenverVacantLot } from '@/components/DenverVacantLotsMap';

type ApiData = {
  generatedAt: string;
  source: string;
  count: number;
  lots: DenverVacantLot[];
  error?: string;
};

function fmtMoney(value?: number | null) {
  return value ? `$${value.toLocaleString()}` : '—';
}
function fmtNumber(value?: number | null) {
  return value ? value.toLocaleString() : '—';
}

export default function DenverVacantLotsMapPage() {
  const [lots, setLots] = useState<DenverVacantLot[]>([]);
  const [generatedAt, setGeneratedAt] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [zip, setZip] = useState('');
  const [selected, setSelected] = useState<DenverVacantLot | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch('/api/land-matcher/denver-vacant-lots', { cache: 'no-store' });
        const data = (await response.json()) as ApiData;
        if (!response.ok) throw new Error(data.error || 'Could not load vacant lots');
        if (cancelled) return;
        setLots(data.lots || []);
        setGeneratedAt(data.generatedAt || '');
        setSource(data.source || 'ATTOM');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load vacant lots');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const zips = useMemo(() => Array.from(new Set(lots.map(lot => lot.zip).filter(Boolean))).sort(), [lots]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lots.filter(lot => {
      if (zip && lot.zip !== zip) return false;
      if (q) {
        const haystack = [lot.address, lot.zip, lot.attomId, lot.apn, lot.landUse, lot.zoning, lot.ownerName, lot.publicPropertyClass, lot.publicVerification?.status, lot.neighborhood, lot.growthNeighborhood, lot.opportunityType, lot.offMarketStatus].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [lots, query, zip]);

  const filteredIds = useMemo(() => new Set(filtered.map(lot => lot.attomId || `${lot.address}-${lot.lat}-${lot.lng}`)), [filtered]);

  const selectedId = selected ? selected.attomId || `${selected.address}-${selected.lat}-${selected.lng}` : null;

  const zipCounts = useMemo(() => {
    return zips.map(value => ({ zip: value, count: lots.filter(lot => lot.zip === value).length })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [lots, zips]);

  const enrichedCount = useMemo(() => lots.filter(lot => Boolean(lot.ownerName || lot.lotSqft || lot.lotAcres || lot.zoning || lot.assessedTotal || lot.lastSaleDate)).length, [lots]);
  const ownerCount = useMemo(() => lots.filter(lot => Boolean(lot.ownerName)).length, [lots]);
  const selectedIsEnriched = Boolean(selected?.ownerName || selected?.lotSqft || selected?.lotAcres || selected?.zoning || selected?.assessedTotal || selected?.lastSaleDate);
  const verificationCounts = useMemo(() => {
    const counts = { verified: 0, improved: 0, conflict: 0, review: 0, unverified: 0 };
    for (const lot of lots) {
      const status = lot.publicVerification?.status;
      if (status === 'verified_vacant_by_public_record') counts.verified += 1;
      else if (status === 'likely_improved_not_vacant') counts.improved += 1;
      else if (status === 'conflicting_public_record') counts.conflict += 1;
      else if (status === 'needs_review') counts.review += 1;
      else counts.unverified += 1;
    }
    return counts;
  }, [lots]);
  const selectedVerificationLabel = selected?.publicVerification?.status === 'verified_vacant_by_public_record' ? 'Public verified vacant'
    : selected?.publicVerification?.status === 'likely_improved_not_vacant' ? 'Likely improved — review'
      : selected?.publicVerification?.status === 'conflicting_public_record' ? 'Conflicting public record'
        : selected?.publicVerification?.status === 'needs_review' ? 'Needs review'
          : 'Unverified';
  const listLots = filtered.slice(0, 150);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-4 flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6B3F1D]">Internal · growth seller targets</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Denver Growth-Area Seller Targets</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">
              {loading ? 'Loading seller targets…' : `${filtered.length.toLocaleString()} of ${lots.length.toLocaleString()} off-market seller targets visible.`} Priority: vacant lots. Secondary: pre-1950 houses. All are individual-owned, 7,000+ sqft, owned 5+ years, and near 2024–2026 new-build activity.
            </p>
            {!loading && (
              <p className="mt-2 max-w-3xl text-xs font-bold text-amber-700">
                Target layer: {lots.filter(lot => lot.opportunityType === 'priority_vacant_lot').length.toLocaleString()} priority vacant lots and {lots.filter(lot => lot.opportunityType === 'secondary_old_house').length.toLocaleString()} secondary pre-1950 old-house targets. Sorted by priority and nearby new-build density.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Generated {generatedAt || '—'}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2">{source || 'ATTOM'}</span>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_140px]">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search address, owner, growth neighborhood, APN, zoning..."
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#10291E]"
          />
          <select value={zip} onChange={e => setZip(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#10291E]">
            <option value="">All ZIPs</option>
            {zips.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <button
            onClick={() => { setQuery(''); setZip(''); setSelected(null); }}
            className="rounded-xl bg-[#10291E] px-4 py-3 text-sm font-black text-white hover:bg-[#1B4332]"
          >
            Clear
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <section className="min-h-[620px]">
            {loading ? (
              <div className="flex min-h-[620px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-500">Loading map…</div>
            ) : (
              <DenverVacantLotsMap lots={lots} filteredIds={filteredIds} selectedId={selectedId} onSelect={setSelected} />
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Current selection</p>
              {selected ? (
                <div className="mt-3">
                  <div className={`mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${selectedIsEnriched ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                    {selectedIsEnriched ? 'Enriched record' : 'Base record · needs enrichment'}
                  </div>
                  <div className={`mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${selected?.publicVerification?.status === 'verified_vacant_by_public_record' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : selected?.publicVerification?.status === 'likely_improved_not_vacant' || selected?.publicVerification?.status === 'conflicting_public_record' ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                    {selectedVerificationLabel}
                  </div>
                  <h2 className="text-xl font-black leading-tight text-[#10291E]">{selected.address || 'Vacant lot'}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">{selected.city}, {selected.state} {selected.zip}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <Detail label="Target type" value={selected.opportunityType === 'priority_vacant_lot' ? 'Priority vacant lot' : 'Secondary old-house target'} />
                    <Detail label="Priority score" value={selected.priorityScore ? String(selected.priorityScore) : '—'} />
                    <Detail label="Growth neighborhood" value={selected.growthNeighborhood || selected.neighborhood || '—'} />
                    <Detail label="Nearby new builds" value={`${selected.nearbyPermitsOneMile || 0} within 1 mile · ${selected.nearbyPermitsTwoMiles || 0} within 2 miles`} />
                    <Detail label="Owner" value={selected.ownerName || '—'} />
                    <Detail label="Owner mailing" value={selected.ownerMailingAddress || '—'} />
                    <Detail label="Off-market status" value={selected.offMarketStatus || 'Off-market best effort'} />
                    <Detail label="Years owned" value={selected.yearsOwned ? String(selected.yearsOwned) : '—'} />
                    <Detail label="Public class" value={selected.publicPropertyClass || '—'} />
                    <Detail label="Public improvement value" value={fmtMoney(selected.publicImprovementValue)} />
                    <Detail label="Public verification reasons" value={selected.publicVerification?.reasons?.length ? selected.publicVerification.reasons.join('; ') : '—'} />
                    <Detail label="ATTOM ID" value={selected.attomId || '—'} />
                    <Detail label="APN" value={selected.apn || '—'} />
                    <Detail label="Land use" value={selected.landUse || '—'} />
                    <Detail label="Zoning" value={selected.zoning || '—'} />
                    <Detail label="Lot sqft" value={fmtNumber(selected.lotSqft)} />
                    <Detail label="Acres" value={selected.lotAcres ? selected.lotAcres.toFixed(3) : '—'} />
                    <Detail label="Assessed total" value={fmtMoney(selected.assessedTotal)} />
                    <Detail label="Improvement value" value={fmtMoney(selected.publicImprovementValue)} />
                    <Detail label="Last sale year" value={selected.lastSaleDate || '—'} />
                    <Detail label="Last sale price" value={fmtMoney(selected.lastSalePrice)} />
                    <Detail label="Year built" value={selected.publicResidentialYearBuilt || '—'} />
                    <Detail label="Residential sqft" value={fmtNumber(selected.publicResidentialArea)} />
                    <Detail label="Flags" value={selected.flags?.length ? selected.flags.join(', ') : '—'} />
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selected.lat},${selected.lng}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex w-full justify-center rounded-xl bg-[#D6A13D] px-4 py-3 text-sm font-black text-[#10291E] hover:bg-[#B9852F]"
                  >
                    Open in Google Maps
                  </a>
                </div>
              ) : (
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">Click a dot on the map to view parcel details here.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Parcel list</p>
              <p className="mt-1 text-xs font-bold text-slate-500">Showing first {listLots.length.toLocaleString()} filtered records. Click a row to inspect it.</p>
              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                {listLots.map(lot => {
                  const id = lot.attomId || `${lot.address}-${lot.lat}-${lot.lng}`;
                  const active = selectedId === id;
                  const enriched = Boolean(lot.ownerName || lot.lotSqft || lot.lotAcres || lot.zoning || lot.assessedTotal || lot.lastSaleDate);
                  const status = lot.publicVerification?.status;
                  const statusLabel = lot.opportunityType === 'priority_vacant_lot' ? 'Vacant lot' : 'Old house';
                  const statusClass = lot.opportunityType === 'priority_vacant_lot' ? 'text-emerald-700' : 'text-violet-700';
                  return (
                    <button
                      key={id}
                      onClick={() => setSelected(lot)}
                      className={`w-full rounded-xl border px-3 py-2 text-left hover:bg-[#F7F1E3] ${active ? 'border-[#D6A13D] bg-[#F7F1E3]' : 'border-slate-100 bg-slate-50'}`}
                    >
                      <span className="block truncate text-sm font-black text-slate-900">{lot.address || 'Vacant lot'}</span>
                      <span className="mt-0.5 flex items-center justify-between gap-2 text-xs font-bold text-slate-500">
                        <span>{lot.growthNeighborhood || lot.zip || 'Denver'} · {lot.lotSqft ? `${lot.lotSqft.toLocaleString()} sqft` : 'lot size —'}</span>
                        <span className={statusClass}>{statusLabel}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Highest-volume ZIPs</p>
              <div className="mt-3 space-y-2">
                {zipCounts.map(item => (
                  <button key={item.zip} onClick={() => setZip(item.zip)} className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-left text-sm font-bold hover:bg-[#F7F1E3]">
                    <span>{item.zip}</span>
                    <span className="text-[#6B3F1D]">{item.count.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold leading-6 text-slate-600 shadow-sm">
              <p className="font-black text-slate-900">Note</p>
              <p className="mt-1">This page uses the 2024–2026 new-build layer to find growth areas, then surfaces individual-owned off-market seller targets: vacant residential lots first, pre-1950 houses second. Current filters: Denver, 7,000+ sqft, known sale year 2021 or older, non-commercial/non-industrial zoning, and no exact local active-listing match.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 break-words font-black text-slate-900">{value}</p>
    </div>
  );
}
