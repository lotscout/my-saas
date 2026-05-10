'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalUsers: number;
  activeListings: number;
  pendingListings: number;
  pendingAnalysis: number;
  pendingBuyerRequests: number;
}

function StatCard({ label, value, icon, color }: { label: string; value: number | null; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex items-center gap-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-none ${color}`}>
        <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-extrabold font-headline text-on-surface">
          {value === null ? <span className="inline-block w-10 h-7 bg-surface-container animate-pulse rounded" /> : value.toLocaleString()}
        </p>
        <p className="text-sm text-on-surface/60 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(err => setError(err.message));
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Admin Dashboard</h1>
        <p className="text-on-surface/50 mt-1 text-sm">Real-time overview of LotScout platform activity.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          Failed to load stats: {error}
        </div>
      )}

      {/* Stats grid */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers ?? null}
            icon="group"
            color="bg-blue-600"
          />
          <StatCard
            label="Active Listings"
            value={stats?.activeListings ?? null}
            icon="home_work"
            color="bg-emerald-600"
          />
          <StatCard
            label="Pending Listings"
            value={stats?.pendingListings ?? null}
            icon="pending_actions"
            color="bg-slate-500"
          />
          <StatCard
            label="Analysis Requests"
            value={stats?.pendingAnalysis ?? null}
            icon="analytics"
            color="bg-purple-600"
          />
        </div>
      </section>

      {/* Action items */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Needs Attention</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/listings"
            className="group bg-white border border-outline-variant/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-none">
              <span className="material-symbols-outlined text-slate-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>list_alt</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-on-surface">Listings Queue</p>
                {stats?.pendingListings ? (
                  <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">{stats.pendingListings}</span>
                ) : null}
              </div>
              <p className="text-xs text-on-surface/50 mt-0.5">Review and approve pending submissions</p>
            </div>
            <span className="material-symbols-outlined text-on-surface/30 group-hover:text-on-surface/60 transition-colors">chevron_right</span>
          </a>

          <a
            href="/admin/analysis"
            className="group bg-white border border-outline-variant/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-none">
              <span className="material-symbols-outlined text-purple-700 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-on-surface">Analysis Queue</p>
                {stats?.pendingAnalysis ? (
                  <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-full">{stats.pendingAnalysis}</span>
                ) : null}
              </div>
              <p className="text-xs text-on-surface/50 mt-0.5">Complete property analysis requests</p>
            </div>
            <span className="material-symbols-outlined text-on-surface/30 group-hover:text-on-surface/60 transition-colors">chevron_right</span>
          </a>

          <a
            href="/admin/users"
            className="group bg-white border border-outline-variant/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-none">
              <span className="material-symbols-outlined text-blue-700 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-on-surface">User Management</p>
                {stats?.totalUsers ? (
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">{stats.totalUsers}</span>
                ) : null}
              </div>
              <p className="text-xs text-on-surface/50 mt-0.5">Manage tiers, permissions, and accounts</p>
            </div>
            <span className="material-symbols-outlined text-on-surface/30 group-hover:text-on-surface/60 transition-colors">chevron_right</span>
          </a>

          <a
            href="/admin/messaging"
            className="group bg-white border border-outline-variant/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-none">
              <span className="material-symbols-outlined text-emerald-700 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-on-surface">Buyer Messaging</p>
              <p className="text-xs text-on-surface/50 mt-0.5">Test buyer-to-seller messaging as a test profile</p>
            </div>
            <span className="material-symbols-outlined text-on-surface/30 group-hover:text-on-surface/60 transition-colors">chevron_right</span>
          </a>
        </div>
      </section>
    </div>
  );
}
