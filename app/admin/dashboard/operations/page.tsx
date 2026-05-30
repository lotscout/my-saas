'use client';

import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Kpis {
  totalListings: number;
  activeBuyerRequests: number;
  reportsGenerated: number;
  avgDeliveryMinutes: number | null;
}

interface PlatformHealth {
  avgViewsPerWeek: number;
  buyerInquiryRate: number;
  reportCompletionRate: number;
  uptimePercent: number;
}

interface ListingSummary {
  id: string;
  title: string | null;
  state: string | null;
  county: string | null;
  city: string | null;
  street_address: string | null;
  lot_size_acres: number | null;
  asking_price: number | null;
  status: string;
  photos_urls: string[] | null;
  user_id: string;
  owner_id: string;
  owner_name: string;
  subscription_tier: string;
  created_at: string;
}

interface BuyerRequestSummary {
  id: string;
  user_id: string;
  submitter_id: string;
  submitter_name: string;
  submitter_email: string | null;
  status: string;
  target_state: string | null;
  target_county: string | null;
  target_city: string | null;
  min_acreage: number | null;
  max_acreage: number | null;
  budget_min: number | null;
  budget_max: number | null;
  use_case: string | null;
  timeline: string | null;
  created_at: string;
}

interface ListingDetail {
  listing: Record<string, unknown>;
  owner: Record<string, unknown> | null;
  ownerTier: string;
}

interface BuyerRequestDetail {
  request: Record<string, unknown>;
  submitter: Record<string, unknown> | null;
  submitterTier: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LISTING_TIER_COLORS: Record<string, string> = {
  free:      '#6B7280',
  standard:  '#1D9E75',
  priority:  '#59C4A0',
  exclusive: '#2563EB',
};

const TIER_BADGE_CLS: Record<string, string> = {
  free:      'bg-gray-100 text-gray-600',
  standard:  'bg-green-100 text-green-700',
  priority:  'bg-teal-100 text-teal-700',
  exclusive: 'bg-blue-100 text-blue-700',
};

const STATUS_CLS: Record<string, string> = {
  active:          'bg-emerald-100 text-emerald-700',
  pending_review:  'bg-yellow-100 text-yellow-700',
  revision_needed: 'bg-orange-100 text-orange-700',
  rejected:        'bg-red-100 text-red-700',
  published:       'bg-emerald-100 text-emerald-700',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtAcres(n: number | null) {
  if (!n) return '—';
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} ac`;
}

function listingLocation(l: ListingSummary | Record<string, unknown>) {
  const parts = [
    l.city as string,
    l.county as string,
    l.state as string,
  ].filter(Boolean);
  if ((l.street_address as string) && parts.length < 2) parts.unshift(l.street_address as string);
  return parts.join(', ') || '—';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  const t = (tier ?? 'free').toLowerCase();
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${TIER_BADGE_CLS[t] ?? 'bg-gray-100 text-gray-600'}`}>
      {t}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_CLS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function StatCard({
  label, value, sub, icon, color,
}: {
  label: string; value: string | number | null; sub?: string; icon: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex items-center gap-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-none ${color}`}>
        <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-2xl font-extrabold font-headline text-on-surface">
          {value === null
            ? <span className="inline-block w-14 h-7 bg-surface-container animate-pulse rounded" />
            : value}
        </p>
        <p className="text-sm text-on-surface/60 font-medium mt-0.5">{label}</p>
        {sub && <p className="text-xs text-on-surface/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({
  label, value, displayValue, color = '#1D9E75',
}: {
  label: string; value: number; displayValue: string; color?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-on-surface/70">{label}</span>
        <span className="font-bold text-on-surface text-sm">{displayValue}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardOperationsPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [tierDist, setTierDist] = useState<Record<string, number>>({});
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [buyerRequests, setBuyerRequests] = useState<BuyerRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Listing slide-out
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [listingDetail, setListingDetail] = useState<ListingDetail | null>(null);
  const [listingDetailLoading, setListingDetailLoading] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  // Buyer request slide-out
  const [selectedBrId, setSelectedBrId] = useState<string | null>(null);
  const [brDetail, setBrDetail] = useState<BuyerRequestDetail | null>(null);
  const [brDetailLoading, setBrDetailLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard/operations')
      .then(r => r.json())
      .then(d => {
        setKpis(d.kpis);
        setHealth(d.platformHealth);
        setTierDist(d.tierDistribution ?? {});
        setListings(d.listings ?? []);
        setBuyerRequests(d.buyerRequests ?? []);
        setLoading(false);
      });
  }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function openListing(id: string) {
    setSelectedListingId(id);
    setListingDetail(null);
    setListingDetailLoading(true);
    const r = await fetch(`/api/admin/dashboard/operations/listings/${id}`);
    const d = await r.json();
    setListingDetail(d);
    setListingDetailLoading(false);
  }

  async function openBuyerRequest(id: string) {
    setSelectedBrId(id);
    setBrDetail(null);
    setBrDetailLoading(true);
    const r = await fetch(`/api/admin/dashboard/operations/buyer-requests/${id}`);
    const d = await r.json();
    setBrDetail(d);
    setBrDetailLoading(false);
  }

  async function setListingStatus(id: string, status: string) {
    setStatusChanging(true);
    const r = await fetch(`/api/admin/listings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      showToast(`Listing set to ${status.replace(/_/g, ' ')}`, true);
      setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      if (listingDetail) {
        setListingDetail(prev => prev
          ? { ...prev, listing: { ...prev.listing, status } }
          : prev
        );
      }
    } else {
      const d = await r.json();
      showToast(d.error ?? 'Failed to update status', false);
    }
    setStatusChanging(false);
  }

  // Chart data
  const pieData = useMemo(() => {
    return [
      { name: 'Free',      value: tierDist.free ?? 0,      color: LISTING_TIER_COLORS.free      },
      { name: 'Standard',  value: tierDist.standard ?? 0,  color: LISTING_TIER_COLORS.standard  },
      { name: 'Priority',  value: tierDist.priority ?? 0,  color: LISTING_TIER_COLORS.priority  },
      { name: 'Exclusive', value: tierDist.exclusive ?? 0, color: LISTING_TIER_COLORS.exclusive },
    ].filter(d => d.value > 0);
  }, [tierDist]);

  const selectedListing = useMemo(
    () => listings.find(l => l.id === selectedListingId) ?? null,
    [listings, selectedListingId]
  );

  const selectedBr = useMemo(
    () => buyerRequests.find(r => r.id === selectedBrId) ?? null,
    [buyerRequests, selectedBrId]
  );

  // ── Render ──

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Operations</h1>
        <p className="text-on-surface/50 mt-1 text-sm">Platform activity, listing pipeline, and buyer request management.</p>
      </div>

      {/* ── KPI Cards ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Listings"
            value={loading ? null : (kpis?.totalListings ?? 0).toLocaleString()}
            icon="home_work"
            color="bg-emerald-600"
          />
          <StatCard
            label="Active Buyer Requests"
            value={loading ? null : (kpis?.activeBuyerRequests ?? 0).toLocaleString()}
            icon="person_search"
            color="bg-blue-600"
          />
          <StatCard
            label="Reports Generated"
            value={loading ? null : (kpis?.reportsGenerated ?? 0).toLocaleString()}
            icon="analytics"
            color="bg-purple-600"
          />
          <StatCard
            label="Avg Report Delivery"
            value={loading ? null : (kpis?.avgDeliveryMinutes != null ? `${kpis.avgDeliveryMinutes} min` : '—')}
            sub="median time to complete"
            icon="schedule"
            color="bg-slate-500"
          />
        </div>
      </section>

      {/* ── Charts / Health ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Breakdown</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Listings by tier doughnut */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
            <h3 className="font-semibold text-on-surface text-sm mb-5">Listings by Owner Tier</h3>
            {loading ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pieData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-on-surface/30 text-sm">No listings yet</div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-44 h-44 flex-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => [(v as number).toLocaleString(), '']}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {[
                    { label: 'Free',      key: 'free'      },
                    { label: 'Standard',  key: 'standard'  },
                    { label: 'Priority',  key: 'priority'  },
                    { label: 'Exclusive', key: 'exclusive' },
                  ].map(({ label, key }) => {
                    const count = tierDist[key] ?? 0;
                    const total = Object.values(tierDist).reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ backgroundColor: LISTING_TIER_COLORS[key] }} />
                          <span className="text-on-surface/70">{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-on-surface">{count.toLocaleString()}</span>
                          <span className="text-xs text-on-surface/40 w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Platform health */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
            <h3 className="font-semibold text-on-surface text-sm mb-5">Platform Health</h3>
            {loading ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-5">
                <ProgressBar
                  label="Avg Listing Views / Week"
                  value={0}
                  displayValue="0"
                  color="#1D9E75"
                />
                <ProgressBar
                  label="Buyer Inquiry Rate"
                  value={health?.buyerInquiryRate ?? 0}
                  displayValue={`${health?.buyerInquiryRate ?? 0}%`}
                  color="#2563EB"
                />
                <ProgressBar
                  label="Report Completion Rate"
                  value={health?.reportCompletionRate ?? 0}
                  displayValue={`${health?.reportCompletionRate ?? 0}%`}
                  color="#7C3AED"
                />
                <ProgressBar
                  label="Platform Uptime"
                  value={health?.uptimePercent ?? 99.9}
                  displayValue={`${health?.uptimePercent ?? 99.9}%`}
                  color="#059669"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Listings Table ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">
          Recent Listings{!loading && ` (${listings.length} shown)`}
        </h2>
        <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-on-surface/40 text-sm">Loading listings…</div>
          ) : listings.length === 0 ? (
            <div className="p-10 text-center text-on-surface/40 text-sm">No listings yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                    {['Location', 'Acreage', 'Owner Tier', 'Listed', 'Views', 'Status'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {listings.map((l, idx) => (
                    <tr
                      key={l.id}
                      onClick={() => openListing(l.id)}
                      className={`hover:bg-surface-container-lowest transition-colors cursor-pointer ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-on-surface truncate max-w-[220px]">
                          {l.title || listingLocation(l)}
                        </p>
                        {l.title && (
                          <p className="text-xs text-on-surface/50 mt-0.5 truncate max-w-[220px]">
                            {listingLocation(l)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-on-surface/70 whitespace-nowrap">{fmtAcres(l.lot_size_acres)}</td>
                      <td className="px-5 py-3.5"><TierBadge tier={l.subscription_tier} /></td>
                      <td className="px-5 py-3.5 text-on-surface/60 whitespace-nowrap">{fmtDate(l.created_at)}</td>
                      <td className="px-5 py-3.5 text-on-surface/40">0</td>
                      <td className="px-5 py-3.5"><StatusBadge status={l.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── Buyer Requests Table ── */}
      <section>
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">
          Buyer Requests{!loading && ` (${buyerRequests.length})`}
        </h2>
        <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-on-surface/40 text-sm">Loading buyer requests…</div>
          ) : buyerRequests.length === 0 ? (
            <div className="p-10 text-center text-on-surface/40 text-sm">No buyer requests yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                    {['Submitted By', 'Location Wanted', 'Acreage', 'Budget', 'Submitted', 'Status'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {buyerRequests.map((r, idx) => {
                    const location = [r.target_city, r.target_county, r.target_state].filter(Boolean).join(', ') || '—';
                    const acreage = [r.min_acreage && `${r.min_acreage}`, r.max_acreage && `${r.max_acreage}`].filter(Boolean).join('–') || '—';
                    const budget = [r.budget_min && fmtMoney(r.budget_min), r.budget_max && fmtMoney(r.budget_max)].filter(Boolean).join(' – ') || '—';
                    return (
                      <tr
                        key={r.id}
                        onClick={() => openBuyerRequest(r.id)}
                        className={`hover:bg-surface-container-lowest transition-colors cursor-pointer ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-on-surface">{r.submitter_name}</p>
                          {r.submitter_email && <p className="text-xs text-on-surface/50 mt-0.5">{r.submitter_email}</p>}
                        </td>
                        <td className="px-5 py-3.5 text-on-surface/70 max-w-[180px] truncate">{location}</td>
                        <td className="px-5 py-3.5 text-on-surface/70 whitespace-nowrap">{acreage} ac</td>
                        <td className="px-5 py-3.5 text-on-surface/70 whitespace-nowrap">{budget}</td>
                        <td className="px-5 py-3.5 text-on-surface/60 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── Listing Slide-out ── */}
      {selectedListingId && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setSelectedListingId(null)} />
          <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
            <div className="flex items-start justify-between px-6 py-4 border-b border-outline-variant/20 flex-none">
              <div className="min-w-0 pr-4">
                <h2 className="font-headline text-lg font-bold text-on-surface truncate">
                  {selectedListing?.title || listingLocation(selectedListing!)}
                </h2>
                <p className="text-xs text-on-surface/50 mt-0.5">{listingLocation(selectedListing!)}</p>
              </div>
              <button onClick={() => setSelectedListingId(null)} className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface/50 flex-none">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {listingDetailLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : listingDetail ? (
                <div className="divide-y divide-outline-variant/10">

                  {/* Status + actions */}
                  <div className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-on-surface/40 uppercase tracking-widest">Status</span>
                      <StatusBadge status={listingDetail.listing.status as string} />
                    </div>
                    <div className="flex items-center gap-2">
                      {listingDetail.listing.status === 'active' ? (
                        <button
                          onClick={() => setListingStatus(selectedListingId!, 'revision_needed')}
                          disabled={statusChanging}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 disabled:opacity-50"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => setListingStatus(selectedListingId!, 'active')}
                          disabled={statusChanging}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          Activate
                        </button>
                      )}
                      {listingDetail.listing.status !== 'rejected' && listingDetail.listing.status !== 'active' && (
                        <button
                          onClick={() => setListingStatus(selectedListingId!, 'rejected')}
                          disabled={statusChanging}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Listing details */}
                  <div className="px-6 py-5">
                    <h3 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-3">Details</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      {[
                        { label: 'Location', value: listingLocation(listingDetail.listing as Record<string, unknown>) },
                        { label: 'Acreage',  value: fmtAcres(listingDetail.listing.lot_size_acres as number | null) },
                        { label: 'Price',    value: listingDetail.listing.asking_price ? fmtMoney(listingDetail.listing.asking_price as number) : '—' },
                        { label: 'Zoning',   value: (listingDetail.listing.zoning as string) || '—' },
                        { label: 'APN',      value: (listingDetail.listing.apn as string) || '—' },
                        { label: 'Listed',   value: fmtDate(listingDetail.listing.created_at as string) },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <dt className="text-on-surface/40 text-xs mb-0.5">{label}</dt>
                          <dd className="font-medium text-on-surface">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    {Boolean(listingDetail.listing.property_description) && (
                      <div className="mt-3">
                        <dt className="text-on-surface/40 text-xs mb-1">Description</dt>
                        <p className="text-sm text-on-surface/70 leading-relaxed line-clamp-4">
                          {listingDetail.listing.property_description as string}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Photos */}
                  {Array.isArray(listingDetail.listing.photos_urls) && (listingDetail.listing.photos_urls as string[]).length > 0 && (
                    <div className="px-6 py-5">
                      <h3 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-3">
                        Photos ({(listingDetail.listing.photos_urls as string[]).length})
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {(listingDetail.listing.photos_urls as string[]).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Photo ${i + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-outline-variant/10 hover:opacity-90 transition-opacity"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contract */}
                  {Boolean(listingDetail.listing.contract_url) && (
                    <div className="px-6 py-4">
                      <h3 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-2">Documents</h3>
                      <a
                        href={listingDetail.listing.contract_url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
                      >
                        <span className="material-symbols-outlined text-base">description</span>
                        View Contract / Document
                      </a>
                    </div>
                  )}

                  {/* Owner */}
                  <div className="px-6 py-5">
                    <h3 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-3">Owner</h3>
                    {listingDetail.owner ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-on-surface text-sm">
                            {(listingDetail.owner.full_name as string) ||
                              [listingDetail.owner.first_name, listingDetail.owner.last_name].filter(Boolean).join(' ') ||
                              (listingDetail.owner.email as string) || '—'}
                          </p>
                          <p className="text-xs text-on-surface/50 mt-0.5">{listingDetail.owner.email as string}</p>
                          <div className="mt-1"><TierBadge tier={listingDetail.ownerTier} /></div>
                        </div>
                        <a
                          href="/admin/dashboard/users"
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-container text-on-surface/70 hover:bg-surface-container-low transition-colors"
                        >
                          View in Users
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-on-surface/40">Owner not found</p>
                    )}
                  </div>

                  {/* Buyer inquiries */}
                  <div className="px-6 py-5">
                    <h3 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-2">Buyer Inquiries</h3>
                    <p className="text-sm text-on-surface/40">No direct inquiry tracking (buyer requests are not linked to specific listings).</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── Buyer Request Slide-out ── */}
      {selectedBrId && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setSelectedBrId(null)} />
          <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
            <div className="flex items-start justify-between px-6 py-4 border-b border-outline-variant/20 flex-none">
              <div className="min-w-0 pr-4">
                <h2 className="font-headline text-lg font-bold text-on-surface">Buyer Request</h2>
                <p className="text-xs text-on-surface/50 mt-0.5">{selectedBr?.submitter_name}</p>
              </div>
              <button onClick={() => setSelectedBrId(null)} className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface/50 flex-none">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {brDetailLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : brDetail ? (
                <div className="divide-y divide-outline-variant/10">

                  {/* Status */}
                  <div className="px-6 py-4 flex items-center gap-3">
                    <span className="text-xs font-bold text-on-surface/40 uppercase tracking-widest">Status</span>
                    <StatusBadge status={brDetail.request.status as string} />
                  </div>

                  {/* Request details */}
                  <div className="px-6 py-5">
                    <h3 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-3">Request Details</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      {[
                        { label: 'Use Case',     value: (brDetail.request.use_case as string) || '—' },
                        { label: 'Location',     value: [brDetail.request.target_city, brDetail.request.target_county, brDetail.request.target_state].filter(Boolean).join(', ') || '—' },
                        { label: 'Min Acreage',  value: brDetail.request.min_acreage ? `${brDetail.request.min_acreage} ac` : '—' },
                        { label: 'Max Acreage',  value: brDetail.request.max_acreage ? `${brDetail.request.max_acreage} ac` : '—' },
                        { label: 'Budget Min',   value: brDetail.request.budget_min ? fmtMoney(brDetail.request.budget_min as number) : '—' },
                        { label: 'Budget Max',   value: brDetail.request.budget_max ? fmtMoney(brDetail.request.budget_max as number) : '—' },
                        { label: 'Timeline',     value: (brDetail.request.timeline as string) || '—' },
                        { label: 'Submitted',    value: fmtDate(brDetail.request.created_at as string) },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <dt className="text-on-surface/40 text-xs mb-0.5">{label}</dt>
                          <dd className="font-medium text-on-surface">{String(value ?? '—')}</dd>
                        </div>
                      ))}
                    </dl>
                    {Boolean(brDetail.request.additional_notes) && (
                      <div className="mt-3">
                        <dt className="text-on-surface/40 text-xs mb-1">Additional Notes</dt>
                        <p className="text-sm text-on-surface/70 leading-relaxed">
                          {brDetail.request.additional_notes as string}
                        </p>
                      </div>
                    )}
                    {Array.isArray(brDetail.request.zoning_preference) && (brDetail.request.zoning_preference as string[]).length > 0 && (
                      <div className="mt-3">
                        <dt className="text-on-surface/40 text-xs mb-1">Zoning Preferences</dt>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(brDetail.request.zoning_preference as string[]).map(z => (
                            <span key={z} className="px-2 py-0.5 bg-surface-container rounded-full text-xs text-on-surface/70">{z}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submitter profile */}
                  <div className="px-6 py-5">
                    <h3 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-3">Submitted By</h3>
                    {brDetail.submitter ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-on-surface text-sm">
                            {(brDetail.submitter.full_name as string) ||
                              [brDetail.submitter.first_name, brDetail.submitter.last_name].filter(Boolean).join(' ') ||
                              (brDetail.submitter.email as string) || '—'}
                          </p>
                          <p className="text-xs text-on-surface/50 mt-0.5">{brDetail.submitter.email as string}</p>
                          {Boolean(brDetail.submitter.company_name) && (
                            <p className="text-xs text-on-surface/50">{brDetail.submitter.company_name as string}</p>
                          )}
                          <div className="mt-1.5"><TierBadge tier={brDetail.submitterTier} /></div>
                        </div>
                        <a
                          href="/admin/dashboard/users"
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-container text-on-surface/70 hover:bg-surface-container-low transition-colors"
                        >
                          View in Users
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-on-surface/40">Submitter not found</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
