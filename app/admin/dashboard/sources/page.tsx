'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Kpis {
  total: number;
  trackedTotal: number;
  uniqueSources: number;
  thisWeekTracked: number;
  thisMonthTracked: number;
}

interface SourceRow {
  source: string;
  count: number;
  pct: number;
}

interface BreakdownRow {
  source: string;
  medium: string;
  campaign: string;
  count: number;
  pct: number;
}

interface WeekPoint {
  week: string;
  tracked: number;
  untracked: number;
  total: number;
}

interface SourcesData {
  kpis: Kpis;
  bySource: SourceRow[];
  breakdown: BreakdownRow[];
  weeklyTrend: WeekPoint[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PALETTE = ['#1D9E75', '#2563EB', '#D97706', '#7C3AED', '#EC4899', '#6B7280'];

function colorFor(i: number) { return PALETTE[i % PALETTE.length]; }

// ─── Sub-components ──────────────────────────────────────────────────────────

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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <span className="material-symbols-outlined text-4xl text-on-surface/20 mb-3 block">track_changes</span>
      <p className="text-sm text-on-surface/40 font-medium">{message}</p>
      <p className="text-xs text-on-surface/30 mt-1">UTM data will appear here once users arrive via tracked links.</p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardSourcesPage() {
  const [data, setData]     = useState<SourcesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard/sources')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  const kpis = data?.kpis;
  const bySource = data?.bySource ?? [];
  const breakdown = data?.breakdown ?? [];
  const weeklyTrend = data?.weeklyTrend ?? [];

  const pieData = bySource.map((row, i) => ({ ...row, color: colorFor(i) }));
  const hasTracked = bySource.some(r => r.source !== 'direct') || bySource.length > 1;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Marketing Sources</h1>
        <p className="text-on-surface/50 mt-1 text-sm">UTM attribution — which channels drive signups.</p>
      </div>

      {/* ── KPI Cards ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Attribution</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Signups"
            value={loading ? null : (kpis?.total ?? 0).toLocaleString()}
            icon="group"
            color="bg-emerald-600"
          />
          <StatCard
            label="UTM-Tracked"
            value={loading ? null : (kpis?.trackedTotal ?? 0).toLocaleString()}
            sub={loading || !kpis ? undefined : `${kpis.total > 0 ? Math.round((kpis.trackedTotal / kpis.total) * 100) : 0}% of total`}
            icon="tracking"
            color="bg-blue-600"
          />
          <StatCard
            label="Unique Sources"
            value={loading ? null : (kpis?.uniqueSources ?? 0)}
            icon="hub"
            color="bg-purple-600"
          />
          <StatCard
            label="Tracked This Month"
            value={loading ? null : (kpis?.thisMonthTracked ?? 0)}
            sub="last 30 days"
            icon="calendar_month"
            color="bg-slate-500"
          />
        </div>
      </section>

      {/* ── Source charts ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">By Source</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Pie */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
            <h3 className="font-semibold text-on-surface text-sm mb-5">Source Distribution</h3>
            {loading ? (
              <div className="h-52 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pieData.length === 0 ? (
              <EmptyState message="No source data yet" />
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
                        dataKey="count"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, _name, props) => [
                          `${(v as number).toLocaleString()} (${props.payload.pct}%)`,
                          'Signups',
                        ]}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2.5 min-w-0">
                  {pieData.map(({ source, count, pct, color }) => (
                    <div key={source} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ backgroundColor: color }} />
                        <span className="text-on-surface/70 truncate font-medium">{source}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-none ml-2">
                        <span className="font-semibold text-on-surface">{count.toLocaleString()}</span>
                        <span className="text-xs text-on-surface/40 w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bar: weekly tracked vs untracked */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
            <h3 className="font-semibold text-on-surface text-sm mb-1">Weekly Signups — Tracked vs Untracked</h3>
            <div className="flex items-center gap-5 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm inline-block" style={{ backgroundColor: '#1D9E75' }} />
                <span className="text-xs text-on-surface/50">UTM-tracked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm inline-block" style={{ backgroundColor: '#E5E7EB' }} />
                <span className="text-xs text-on-surface/50">Direct / unknown</span>
              </div>
            </div>
            {loading ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={176}>
                <BarChart data={weeklyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip
                    formatter={(v, name) => [(v as number).toLocaleString(), String(name)]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Bar dataKey="tracked"   name="UTM-tracked"      stackId="a" fill="#1D9E75" radius={[0, 0, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="untracked" name="Direct / unknown" stackId="a" fill="#E5E7EB" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* ── Horizontal bar: source ranking ── */}
      {!loading && bySource.length > 1 && (
        <section className="mb-10">
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
            <h3 className="font-semibold text-on-surface text-sm mb-5">Source Ranking</h3>
            <div className="space-y-3">
              {bySource.map((row, i) => (
                <div key={row.source}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ backgroundColor: colorFor(i) }} />
                      <span className="font-medium text-on-surface">{row.source}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-on-surface">{row.count.toLocaleString()}</span>
                      <span className="text-xs text-on-surface/40 w-10 text-right">{row.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${row.pct}%`, backgroundColor: colorFor(i) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Full breakdown table ── */}
      <section>
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">
          Full Breakdown — Source × Medium × Campaign
        </h2>
        <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-on-surface/40 text-sm">Loading…</div>
          ) : breakdown.length === 0 ? (
            <EmptyState message="No attribution data yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                    {['Source', 'Medium', 'Campaign', 'Signups', 'Share'].map(h => (
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
                  {breakdown.map((row, idx) => {
                    const srcIdx = bySource.findIndex(s => s.source === row.source);
                    const color  = colorFor(srcIdx >= 0 ? srcIdx : idx);
                    return (
                      <tr key={idx} className={`hover:bg-surface-container-lowest transition-colors ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-none" style={{ backgroundColor: color }} />
                            <span className="font-semibold text-on-surface">{row.source}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-on-surface/60">
                          {row.medium || <span className="text-on-surface/30">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-on-surface/60">
                          {row.campaign || <span className="text-on-surface/30">—</span>}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-on-surface">{row.count.toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 bg-surface-container rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${row.pct}%`, backgroundColor: color }}
                              />
                            </div>
                            <span className="text-xs text-on-surface/50 w-9 text-right">{row.pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && !hasTracked && (
          <p className="text-xs text-on-surface/40 text-center mt-4">
            All current signups predate UTM tracking. Data will populate as new users arrive via tracked links.
          </p>
        )}
      </section>

    </div>
  );
}
