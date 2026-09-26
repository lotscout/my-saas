'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatCurrency, formatSqft, type LandParcel } from '@/lib/land-matcher';

type DashboardData = {
  parcels: LandParcel[];
  counts?: { parcels?: number; buyers?: number };
  source?: string;
};

function csvEscape(value: unknown) {
  const text = value === undefined || value === null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(rows: LandParcel[]) {
  const headers = [
    'Address',
    'Owner',
    'Owner Mailing Address',
    'Neighborhood/Subdivision',
    'ZIP',
    'Zoning',
    'Land Use',
    'Lot Sqft',
    'Assessed Value',
    'Last Sale Price',
    'Last Sale Year',
    'Years Owned',
    'Absentee Owner',
    'Out of State Owner',
    'ATTOM ID',
    'APN',
    'Latitude',
    'Longitude',
    'Flags',
  ];

  const body = rows.map(parcel => [
    parcel.address,
    parcel.ownerName,
    parcel.ownerMailingAddress,
    parcel.neighborhood,
    parcel.zip,
    parcel.zoning,
    parcel.landUse,
    parcel.lotSqft,
    parcel.assessedValue,
    parcel.lastSalePrice,
    parcel.lastSaleYear,
    parcel.yearsOwned,
    parcel.absenteeOwner ? 'Yes' : 'No',
    parcel.outOfStateOwner ? 'Yes' : 'No',
    parcel.attomId,
    (parcel as LandParcel & { apn?: string }).apn,
    parcel.lat,
    parcel.lng,
    parcel.flags?.join('; '),
  ].map(csvEscape).join(','));

  const csv = [headers.map(csvEscape).join(','), ...body].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `denver-attom-land-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function numberOrBlank(value: number | undefined) {
  return value ? value.toLocaleString() : '—';
}

export default function InternalLandDashboard() {
  const [parcels, setParcels] = useState<LandParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [zip, setZip] = useState('');
  const [zoning, setZoning] = useState('');
  const [ownerType, setOwnerType] = useState('');
  const [absenteeOnly, setAbsenteeOnly] = useState(false);
  const [minLotSqft, setMinLotSqft] = useState('');

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/land-matcher/data', { cache: 'no-store' });
      const data = (await response.json()) as DashboardData & { error?: string; details?: string };
      if (!response.ok) throw new Error(data.details || data.error || 'Could not load data');
      setParcels(data.parcels || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const zips = useMemo(() => Array.from(new Set(parcels.map(p => p.zip).filter(Boolean))).sort(), [parcels]);
  const zonings = useMemo(() => Array.from(new Set(parcels.map(p => p.zoning).filter(Boolean))).sort(), [parcels]);
  const ownerTypes = useMemo(() => Array.from(new Set(parcels.map(p => p.ownerType).filter(Boolean))).sort(), [parcels]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minLot = Number(minLotSqft || 0);
    return parcels.filter(parcel => {
      const haystack = [parcel.address, parcel.ownerName, parcel.ownerMailingAddress, parcel.neighborhood, parcel.zoning, parcel.landUse, parcel.zip, parcel.flags?.join(' ')].join(' ').toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (zip && parcel.zip !== zip) return false;
      if (zoning && parcel.zoning !== zoning) return false;
      if (ownerType && parcel.ownerType !== ownerType) return false;
      if (absenteeOnly && !parcel.absenteeOwner) return false;
      if (minLot && parcel.lotSqft < minLot) return false;
      return true;
    });
  }, [parcels, query, zip, zoning, ownerType, absenteeOnly, minLotSqft]);

  const stats = useMemo(() => {
    const absentee = parcels.filter(p => p.absenteeOwner).length;
    const avgLot = parcels.length ? Math.round(parcels.reduce((sum, p) => sum + (p.lotSqft || 0), 0) / parcels.length) : 0;
    const totalValue = parcels.reduce((sum, p) => sum + (p.assessedValue || 0), 0);
    return { absentee, avgLot, totalValue };
  }, [parcels]);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-6 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Internal dashboard</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Denver ATTOM Land Data</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600">
              Real Denver parcel profiles imported from ATTOM. Filter, review owners, and export the rows you want to work.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={loadData} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-100">
              Refresh
            </button>
            <button onClick={() => downloadCsv(filtered)} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-800">
              Export CSV ({filtered.length})
            </button>
          </div>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total ATTOM parcels</p>
            <p className="mt-1 text-3xl font-black">{parcels.length.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Filtered rows</p>
            <p className="mt-1 text-3xl font-black">{filtered.length.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Absentee owners</p>
            <p className="mt-1 text-3xl font-black">{stats.absentee.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg lot size</p>
            <p className="mt-1 text-3xl font-black">{formatSqft(stats.avgLot)}</p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search address, owner, zoning, flags..."
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-600 xl:col-span-2"
            />
            <select value={zip} onChange={e => setZip(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
              <option value="">All ZIPs</option>
              {zips.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <select value={zoning} onChange={e => setZoning(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
              <option value="">All zoning</option>
              {zonings.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <select value={ownerType} onChange={e => setOwnerType(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
              <option value="">All owner types</option>
              {ownerTypes.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <input
              value={minLotSqft}
              onChange={e => setMinLotSqft(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Min lot sqft"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-600"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={absenteeOnly} onChange={e => setAbsenteeOnly(e.target.checked)} />
              Absentee only
            </label>
            {(query || zip || zoning || ownerType || absenteeOnly || minLotSqft) && (
              <button
                onClick={() => { setQuery(''); setZip(''); setZoning(''); setOwnerType(''); setAbsenteeOnly(false); setMinLotSqft(''); }}
                className="text-sm font-bold text-emerald-700 hover:text-emerald-900"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-[1400px] w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3">Property</th>
                  <th className="border-b border-slate-200 px-4 py-3">Owner</th>
                  <th className="border-b border-slate-200 px-4 py-3">Mailing</th>
                  <th className="border-b border-slate-200 px-4 py-3">Zoning</th>
                  <th className="border-b border-slate-200 px-4 py-3">Lot</th>
                  <th className="border-b border-slate-200 px-4 py-3">Assessed</th>
                  <th className="border-b border-slate-200 px-4 py-3">Sale</th>
                  <th className="border-b border-slate-200 px-4 py-3">Signals</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center font-bold text-slate-500">Loading ATTOM records…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center font-bold text-slate-500">No rows match your filters.</td></tr>
                ) : filtered.map(parcel => (
                  <tr key={`${parcel.attomId}-${parcel.address}-${parcel.lotSqft}`} className="border-b border-slate-100 hover:bg-emerald-50/40">
                    <td className="px-4 py-3 align-top">
                      <p className="font-black text-slate-900">{parcel.address}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{parcel.neighborhood} · {parcel.zip} · ATTOM {parcel.attomId}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-bold">{parcel.ownerName}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{parcel.ownerType}</p>
                    </td>
                    <td className="max-w-[260px] px-4 py-3 align-top font-semibold text-slate-700">{parcel.ownerMailingAddress || '—'}</td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-black">{parcel.zoning || '—'}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{parcel.landUse}</p>
                    </td>
                    <td className="px-4 py-3 align-top font-bold">{parcel.lotSqft ? formatSqft(parcel.lotSqft) : '—'}</td>
                    <td className="px-4 py-3 align-top font-bold">{parcel.assessedValue ? formatCurrency(parcel.assessedValue) : '—'}</td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-bold">{parcel.lastSalePrice ? formatCurrency(parcel.lastSalePrice) : '—'}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{parcel.lastSaleYear || '—'} · {numberOrBlank(parcel.yearsOwned)} yrs</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex max-w-[260px] flex-wrap gap-1.5">
                        {parcel.absenteeOwner && <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">Absentee</span>}
                        {parcel.outOfStateOwner && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">Out of state</span>}
                        {(parcel.flags || []).slice(0, 3).map(flag => <span key={flag} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{flag}</span>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
