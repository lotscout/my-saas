'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import UserDetailPanel, { getUserName } from '../_components/UserDetailPanel';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  company_name: string | null;
  state: string | null;
  subscription_tier: string;
  is_admin: boolean;
  is_test_profile: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TIER_PIE_COLORS: Record<string, string> = {
  free:      '#6B7280',
  standard:  '#1D9E75',
  priority:  '#2563EB',
  exclusive: '#7C3AED',
};

const TIER_BADGE_CLS: Record<string, string> = {
  free:      'bg-gray-100 text-gray-600',
  standard:  'bg-green-100 text-green-700',
  priority:  'bg-blue-100 text-blue-700',
  exclusive: 'bg-purple-100 text-purple-700',
};

const TIER_PRICES: Record<string, number> = { standard: 129, priority: 249, exclusive: 599 };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function getWeeklyGrowth(users: DashboardUser[]) {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return Array.from({ length: 8 }, (_, idx) => {
    const weeksBack = 7 - idx;
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - weeksBack * 7);
    const count = users.filter(u => new Date(u.created_at) <= weekEnd).length;
    return {
      week: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      users: count,
    };
  });
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardUsersPage() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard/users')
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setLoading(false); });
  }, []);

  // ── Computed values ──

  const realUsers = useMemo(() => users.filter(u => !u.is_test_profile), [users]);

  const tierCounts = useMemo(() => ({
    free:      realUsers.filter(u => u.subscription_tier === 'free').length,
    standard:  realUsers.filter(u => u.subscription_tier === 'standard').length,
    priority:  realUsers.filter(u => u.subscription_tier === 'priority').length,
    exclusive: realUsers.filter(u => u.subscription_tier === 'exclusive').length,
  }), [realUsers]);

  const paidCount = tierCounts.standard + tierCounts.priority + tierCounts.exclusive;

  const avgLTV = useMemo(() => {
    if (paidCount === 0) return 0;
    const total = Object.entries(TIER_PRICES).reduce((sum, [tier, price]) => {
      return sum + tierCounts[tier as keyof typeof tierCounts] * price;
    }, 0);
    return Math.round(total / paidCount);
  }, [tierCounts, paidCount]);

  const pieData = useMemo(() => [
    { name: 'Free',      value: tierCounts.free,      color: TIER_PIE_COLORS.free      },
    { name: 'Standard',  value: tierCounts.standard,  color: TIER_PIE_COLORS.standard  },
    { name: 'Priority',  value: tierCounts.priority,  color: TIER_PIE_COLORS.priority  },
    { name: 'Exclusive', value: tierCounts.exclusive, color: TIER_PIE_COLORS.exclusive },
  ].filter(d => d.value > 0), [tierCounts]);

  const growthData = useMemo(() => getWeeklyGrowth(realUsers), [realUsers]);

  const filtered = useMemo(() => {
    if (!search) return realUsers;
    const q = search.toLowerCase();
    return realUsers.filter(u =>
      getUserName(u).toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    );
  }, [realUsers, search]);

  const selectedUser = useMemo(() => users.find(u => u.id === selectedId) ?? null, [users, selectedId]);

  // ── Render ──

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="mb-10">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Users</h1>
        <p className="text-on-surface/50 mt-1 text-sm">Subscription breakdown, growth, and user management.</p>
      </div>

      {/* ── KPI Cards ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={loading ? null : realUsers.length.toLocaleString()}
            icon="group"
            color="bg-blue-600"
          />
          <StatCard
            label="Paid Users"
            value={loading ? null : paidCount.toLocaleString()}
            icon="star"
            color="bg-emerald-600"
          />
          <StatCard
            label="Free Users"
            value={loading ? null : tierCounts.free.toLocaleString()}
            icon="person"
            color="bg-slate-500"
          />
          <StatCard
            label="Avg LTV"
            value={loading ? null : (paidCount > 0 ? fmtMoney(avgLTV) : '—')}
            sub="per paid user / mo"
            icon="payments"
            color="bg-purple-600"
          />
        </div>
      </section>

      {/* ── Charts ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Breakdown</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Doughnut */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
            <h3 className="font-semibold text-on-surface text-sm mb-5">Users by Tier</h3>
            {loading ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
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
                    { label: 'Free',      count: tierCounts.free,      color: TIER_PIE_COLORS.free      },
                    { label: 'Standard',  count: tierCounts.standard,  color: TIER_PIE_COLORS.standard  },
                    { label: 'Priority',  count: tierCounts.priority,  color: TIER_PIE_COLORS.priority  },
                    { label: 'Exclusive', count: tierCounts.exclusive, color: TIER_PIE_COLORS.exclusive },
                  ].map(({ label, count, color }) => {
                    const pct = realUsers.length > 0 ? Math.round((count / realUsers.length) * 100) : 0;
                    return (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ backgroundColor: color }} />
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

          {/* Area chart */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
            <h3 className="font-semibold text-on-surface text-sm mb-5">Cumulative User Growth (8 weeks)</h3>
            {loading ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={176}>
                <AreaChart data={growthData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                  <defs>
                    <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#1D9E75" stopOpacity={0.01} />
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
                    width={36}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(v) => [(v as number).toLocaleString(), 'Total Users']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#1D9E75"
                    strokeWidth={2}
                    fill="url(#userGrowthGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#1D9E75' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* ── Users Table ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest">
            All Users{!loading && ` (${filtered.length.toLocaleString()})`}
          </h2>
          <div className="relative w-72">
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
        </div>

        <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-on-surface/40 text-sm">Loading users…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                    {['Name', 'Email', 'Tier', 'State', 'Joined', 'Last Active'].map(h => (
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
                      <td colSpan={6} className="px-5 py-10 text-center text-on-surface/40 text-sm">
                        No users found
                      </td>
                    </tr>
                  ) : filtered.map((u, idx) => {
                    const today = u.updated_at && isToday(u.updated_at);
                    return (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedId(u.id)}
                        className={`hover:bg-surface-container-lowest transition-colors cursor-pointer ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-medium text-on-surface">{getUserName(u)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-on-surface/60">{u.email ?? '—'}</td>
                        <td className="px-5 py-3.5"><TierBadge tier={u.subscription_tier} /></td>
                        <td className="px-5 py-3.5 text-on-surface/60">{u.state ?? '—'}</td>
                        <td className="px-5 py-3.5 text-on-surface/60 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {today
                            ? <span className="text-emerald-600 font-semibold text-xs">Today</span>
                            : <span className="text-on-surface/50">{u.updated_at ? fmtDate(u.updated_at) : '—'}</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
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
        onAdminToggled={(id, newVal) =>
          setUsers(prev => prev.map(u => u.id === id ? { ...u, is_admin: newVal } : u))
        }
      />
    </div>
  );
}
