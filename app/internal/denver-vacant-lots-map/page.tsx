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
        const haystack = [lot.address, lot.zip, lot.attomId, lot.apn, lot.landUse, lot.zoning].join(' ').toLowerCase();
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-4 flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6B3F1D]">Internal · ATTOM vacant land</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Denver Vacant Lots Map</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">
              {loading ? 'Loading ATTOM vacant lot points…' : `${filtered.length.toLocaleString()} of ${lots.length.toLocaleString()} vacant-lot records visible.`} Click any dot to see parcel details.
            </p>
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
            placeholder="Search address, ZIP, ATTOM ID, APN, zoning..."
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
                  <h2 className="text-xl font-black leading-tight text-[#10291E]">{selected.address || 'Vacant lot'}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">{selected.city}, {selected.state} {selected.zip}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <Detail label="ATTOM ID" value={selected.attomId || '—'} />
                    <Detail label="APN" value={selected.apn || '—'} />
                    <Detail label="Land use" value={selected.landUse || 'Vacant land'} />
                    <Detail label="Zoning" value={selected.zoning || '—'} />
                    <Detail label="Lot sqft" value={fmtNumber(selected.lotSqft)} />
                    <Detail label="Acres" value={selected.lotAcres ? selected.lotAcres.toFixed(3) : '—'} />
                    <Detail label="Assessed total" value={fmtMoney(selected.assessedTotal)} />
                    <Detail label="Assessed land" value={fmtMoney(selected.assessedLand)} />
                    <Detail label="Last sale" value={fmtMoney(selected.lastSalePrice)} />
                    <Detail label="Sale date" value={selected.lastSaleDate || '—'} />
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
              <p className="mt-1">This first map uses ATTOM search results: address, ATTOM ID, APN when available, and coordinates. We still need expanded-profile enrichment for owner, lot size, zoning, assessed value, and sale fields where ATTOM did not include them in search.</p>
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
