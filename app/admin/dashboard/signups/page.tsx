'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import UserDetailPanel, { getUserName } from '../_components/UserDetailPanel';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SignupProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  state: string | null;
  signup_source?: string | null;
  subscription_tier: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface Kpis {
  thisWeekSignups: number;
  thisMonthSignups: number;
  freeToPaidRate: number;
  avgDaysToPaid: number | null;
}

interface WeekPoint {
  week: string;
  total: number;
  paid: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TIER_BADGE_CLS: Record<string, string> = {
  free:      'bg-gray-100 text-gray-600',
  standard:  'bg-green-100 text-green-700',
  priority:  'bg-blue-100 text-blue-700',
  exclusive: 'bg-purple-100 text-purple-700',
};

const SOURCE_COLORS = ['#1D9E75', '#2563EB', '#D97706', '#7C3AED', '#6B7280'];

const FUNNEL_STEPS = [
  { label: 'Visitors',     color: '#1D9E75', note: 'Tracked in Vercel Analytics' },
  { label: 'Free Signup',  color: '#0F6E56' },
  { label: '$9 Report',    color: '#2563EB' },
  { label: 'Paid Plan',    color: '#059669' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysActive(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function exportCsv(profiles: SignupProfile[]) {
  const headers = ['Name', 'Email', 'Tier', 'State', 'Source', 'Joined', 'Days Active'];
  const rows = profiles.map(p => [
    getUserName(p),
    p.email ?? '',
    p.subscription_tier,
    p.state ?? '',
    p.signup_source ?? '',
    fmtDate(p.created_at),
    String(daysActive(p.created_at)),
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `signups-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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

function StatCard({
  label, value, icon, color,
}: {
  label: string; value: string | number | null; icon: string; color: string;
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
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardSignupsPage() {
  const [kpis, setKpis]                           = useState<Kpis | null>(null);
  const [weeklyData, setWeeklyData]               = useState<WeekPoint[]>([]);
  const [sourceCounts, setSourceCounts]           = useState<Record<string, number>>({});
  const [sourceColumnExists, setSourceColumnExists] = useState(true);
  const [reportUserCount, setReportUserCount]     = useState(0);
  const [profiles, setProfiles]                   = useState<SignupProfile[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [search, setSearch]                       = useState('');
  const [selectedId, setSelectedId]               = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard/signups')
      .then(r => r.json())
      .then(d => {
        setKpis(d.kpis ?? null);
        setWeeklyData(d.weeklyData ?? []);
        setSourceCounts(d.sourceCounts ?? {});
        setSourceColumnExists(d.sourceColumnExists ?? false);
        setReportUserCount(d.reportUserCount ?? 0);
        setProfiles(d.profiles ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return profiles;
    const q = search.toLowerCase();
    return profiles.filter(p =>
      getUserName(p).toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q)
    );
  }, [profiles, search]);

  const selectedUser = useMemo(
    () => profiles.find(p => p.id === selectedId) ?? null,
    [profiles, selectedId]
  );

  // ── Funnel data ────────────────────────────────────────────────────────────

  const funnelValues = useMemo(() => {
    const total = profiles.length;
    const paid  = profiles.filter(p => p.subscription_tier !== 'free').length;
    return [0, total, reportUserCount, paid];
  }, [profiles, reportUserCount]);

  const funnelMax = useMemo(() => Math.max(...funnelValues, 1), [funnelValues]);

  // ── Source pie data ────────────────────────────────────────────────────────

  const pieData = useMemo(() =>
    Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: SOURCE_COLORS[i % SOURCE_COLORS.length] })),
    [sourceCounts]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Signups</h1>
        <p className="text-on-surface/50 mt-1 text-sm">Acquisition trends, conversion funnel, and signup sources.</p>
      </div>

      {/* ── KPI Cards ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">This Period</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="This Week"
            value={loading ? null : kpis?.thisWeekSignups ?? 0}
            icon="person_add"
            color="bg-emerald-600"
          />
          <StatCard
            label="This Month"
            value={loading ? null : kpis?.thisMonthSignups ?? 0}
            icon="calendar_month"
            color="bg-blue-600"
          />
          <StatCard
            label="Free → Paid Rate"
            value={loading ? null : `${kpis?.freeToPaidRate.toFixed(1) ?? '0.0'}%`}
            icon="trending_up"
            color="bg-purple-600"
          />
          <StatCard
            label="Avg Days to Paid"
            value={loading ? null : (kpis?.avgDaysToPaid != null ? `${kpis.avgDaysToPaid}d` : '—')}
            icon="schedule"
            color="bg-slate-500"
          />
        </div>
      </section>

      {/* ── Trend Chart ── */}
      <section className="mb-10">
        <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
          <h3 className="font-semibold text-on-surface text-sm mb-1">Weekly Signups (last 8 weeks)</h3>
          <div className="flex items-center gap-5 mb-5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full bg-[#1D9E75] inline-block" />
              <span className="text-xs text-on-surface/50">Total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full bg-[#2563EB] inline-block" />
              <span className="text-xs text-on-surface/50">Converted to Paid</span>
            </div>
          </div>
          {loading ? (
            <div className="h-52 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={208}>
              <AreaChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="signupGradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1D9E75" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#1D9E75" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="signupGradPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.06} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#1D9E75"
                  strokeWidth={2}
                  fill="url(#signupGradTotal)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#1D9E75' }}
                />
                <Area
                  type="monotone"
                  dataKey="paid"
                  name="Converted to Paid"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#signupGradPaid)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#2563EB' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ── Funnel + Sources ── */}
      <section className="mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Conversion Funnel */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
            <h3 className="font-semibold text-on-surface text-sm mb-5">Conversion Funnel</h3>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 bg-surface-container animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {FUNNEL_STEPS.map((step, i) => {
                  const val = funnelValues[i];
                  const pct = funnelMax > 0 ? Math.round((val / funnelMax) * 100) : 0;
                  return (
                    <div key={step.label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-on-surface">{step.label}</span>
                          {step.note && (
                            <span className="text-xs text-on-surface/30 italic">{step.note}</span>
                          )}
                        </div>
                        <span className="font-semibold text-on-surface">{val.toLocaleString()}</span>
                      </div>
                      <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: step.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Signup Sources */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
            <h3 className="font-semibold text-on-surface text-sm mb-5">Signup Sources</h3>
            {loading ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !sourceColumnExists ? (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface/20 mb-2 block">analytics</span>
                <p className="text-sm font-medium text-on-surface/40">signup_source column not added yet</p>
                <p className="text-xs text-on-surface/30 mt-1">Run the SQL below to enable source tracking.</p>
              </div>
            ) : pieData.length === 0 ? (
              <div className="py-8 text-center text-sm text-on-surface/40">No source data yet</div>
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
                <div className="flex-1 space-y-2.5 min-w-0">
                  {pieData.map(({ name, value, color }) => {
                    const total = pieData.reduce((s, d) => s + d.value, 0);
                    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                    return (
                      <div key={name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ backgroundColor: color }} />
                          <span className="text-on-surface/70 truncate">{name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-none ml-2">
                          <span className="font-semibold text-on-surface">{value.toLocaleString()}</span>
                          <span className="text-xs text-on-surface/40 w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Signups Table ── */}
      <section>
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest">
            All Signups{!loading && ` (${filtered.length.toLocaleString()})`}
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 text-base">
                search
              </span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name or email…"
                className="w-full bg-white border border-outline-variant/20 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface/30"
              />
            </div>
            <button
              onClick={() => exportCsv(filtered)}
              disabled={loading || filtered.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface/70 hover:bg-surface-container-low transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-base">download</span>
              CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-on-surface/40 text-sm">Loading signups…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                    {['Name', 'Email', 'Tier', 'State', 'Source', 'Joined', 'Days Active'].map(h => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-on-surface/40 text-sm">
                        No signups found
                      </td>
                    </tr>
                  ) : filtered.map((p, idx) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`hover:bg-surface-container-lowest transition-colors cursor-pointer ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                    >
                      <td className="px-5 py-3.5 font-medium text-on-surface whitespace-nowrap">
                        {getUserName(p)}
                      </td>
                      <td className="px-5 py-3.5 text-on-surface/60">{p.email ?? '—'}</td>
                      <td className="px-5 py-3.5"><TierBadge tier={p.subscription_tier} /></td>
                      <td className="px-5 py-3.5 text-on-surface/60">{p.state ?? '—'}</td>
                      <td className="px-5 py-3.5 text-on-surface/50">{p.signup_source ?? '—'}</td>
                      <td className="px-5 py-3.5 text-on-surface/60 whitespace-nowrap">{fmtDate(p.created_at)}</td>
                      <td className="px-5 py-3.5 text-on-surface/60">{daysActive(p.created_at)}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <UserDetailPanel
        selectedId={selectedId}
        selectedUser={selectedUser}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
