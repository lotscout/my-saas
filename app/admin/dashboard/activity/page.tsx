'use client';

import { useEffect, useState, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Kpis {
  eventsToday: number;
  signupsToday: number;
  listingsToday: number;
  paymentsToday: number;
}

interface ActivityEvent {
  id: string;
  type: string;
  title: string;
  description: string | null;
  created_at: string;
}

type FilterKey = 'all' | 'signup' | 'listing' | 'payment' | 'report' | 'buyer' | 'email';

// ─── Constants ───────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  signup:  '#1D9E75',
  listing: '#2563EB',
  payment: '#059669',
  report:  '#D97706',
  buyer:   '#7C3AED',
  email:   '#1D9E75',
};

const EVENT_ICONS: Record<string, string> = {
  signup:  'person_add',
  listing: 'home_work',
  payment: 'payments',
  report:  'analytics',
  buyer:   'person_search',
  email:   'mail',
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',     label: 'All'     },
  { key: 'signup',  label: 'Signup'  },
  { key: 'listing', label: 'Listing' },
  { key: 'payment', label: 'Payment' },
  { key: 'report',  label: 'Report'  },
  { key: 'buyer',   label: 'Buyer'   },
  { key: 'email',   label: 'Email'   },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const d = new Date(iso);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, color,
}: {
  label: string; value: number | null; icon: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex items-center gap-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-none ${color}`}>
        <span
          className="material-symbols-outlined text-white text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
      <div>
        <p className="text-2xl font-extrabold font-headline text-on-surface">
          {value === null
            ? <span className="inline-block w-14 h-7 bg-surface-container animate-pulse rounded" />
            : value.toLocaleString()}
        </p>
        <p className="text-sm text-on-surface/60 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: ActivityEvent }) {
  const color = EVENT_COLORS[event.type] ?? '#6B7280';
  const icon  = EVENT_ICONS[event.type]  ?? 'circle';

  return (
    <div className="flex items-start gap-3 px-6 py-4 hover:bg-surface-container-lowest transition-colors">
      {/* Icon box */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-none mt-0.5"
        style={{ backgroundColor: hexToRgba(color, 0.12) }}
      >
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ color, fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: '1.4' }}>
          {event.title}
        </p>
        {event.description && (
          <p className="text-xs text-on-surface/50 mt-0.5 truncate">{event.description}</p>
        )}
      </div>

      {/* Badge + time */}
      <div className="flex flex-col items-end gap-1.5 flex-none">
        <span
          className="px-2 py-0.5 rounded-full capitalize"
          style={{
            fontSize: 11,
            fontWeight: 600,
            backgroundColor: hexToRgba(color, 0.12),
            color,
          }}
        >
          {event.type}
        </span>
        <span className="text-on-surface/40" style={{ fontSize: 11 }}>
          {relativeTime(event.created_at)}
        </span>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardActivityPage() {
  const [kpis, setKpis]           = useState<Kpis | null>(null);
  const [feed, setFeed]           = useState<ActivityEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tablesReady, setTablesReady] = useState(true);
  const [isLive, setIsLive]       = useState(false);
  const [filter, setFilter]       = useState<FilterKey>('all');

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const r = await fetch('/api/admin/dashboard/activity');
        const d = await r.json();
        if (!mounted) return;
        setKpis(d.kpis);
        setFeed(d.feed ?? []);
        setTablesReady(d.tablesReady ?? false);
      } catch {
        // silently ignore fetch errors
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    setIsLive(true);

    return () => {
      mounted = false;
      clearInterval(interval);
      setIsLive(false);
    };
  }, []);

  const filteredFeed = useMemo(() => {
    if (filter === 'all') return feed;
    return feed.filter(e => e.type === filter);
  }, [feed, filter]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
            Activity
          </h1>
          {isLive && (
            <div className="relative w-2.5 h-2.5 mt-1">
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
              <div className="relative rounded-full bg-emerald-500 w-2.5 h-2.5" />
            </div>
          )}
        </div>
        <p className="text-on-surface/50 mt-1 text-sm">
          Platform event stream — auto-refreshes every 30 seconds.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Today</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Events Today"
            value={loading ? null : (kpis?.eventsToday ?? 0)}
            icon="bolt"
            color="bg-emerald-600"
          />
          <StatCard
            label="New Signups"
            value={loading ? null : (kpis?.signupsToday ?? 0)}
            icon="person_add"
            color="bg-blue-600"
          />
          <StatCard
            label="New Listings"
            value={loading ? null : (kpis?.listingsToday ?? 0)}
            icon="home_work"
            color="bg-slate-500"
          />
          <StatCard
            label="Payments"
            value={loading ? null : (kpis?.paymentsToday ?? 0)}
            icon="payments"
            color="bg-purple-600"
          />
        </div>
      </section>

      {/* ── Activity Feed ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest">
            Live Feed{!loading && ` (${filteredFeed.length})`}
          </h2>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="px-3.5 py-1.5 rounded-lg text-sm transition-all border"
                style={active ? {
                  backgroundColor: '#E8F5F0',
                  color: '#0F6E56',
                  borderColor: '#1D9E75',
                  fontWeight: 600,
                } : {
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  borderColor: 'transparent',
                  fontWeight: 500,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Feed card */}
        <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-on-surface/40 text-sm">Loading activity…</div>
          ) : !tablesReady ? (
            <div className="p-10 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface/20 mb-3 block">
                database
              </span>
              <p className="text-sm font-semibold text-on-surface/50">Activity log table not set up yet</p>
              <p className="text-xs text-on-surface/30 mt-1">
                Run the SQL shown below in Supabase to enable real-time event tracking.
              </p>
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="p-10 text-center text-on-surface/40 text-sm">
              No {filter === 'all' ? '' : filter + ' '}events yet
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/10">
              {filteredFeed.map(event => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
