'use client';

import { useEffect, useState, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Totals {
  users: number; newUsers7d: number; listings: number; buyerRequests: number;
  messages: number; conversations: number; scoutQuestions: number;
  analysisRequests: number; marketReports: number; emails: number;
  pendingListings: number; pendingAnalysis: number; pendingBuyerRequests: number;
}
interface Signup { id: string; name: string; email: string | null; source: string | null; created_at: string; }
interface Listing { id: string; title: string; seller: string; location: string; price: number | null; status: string | null; created_at: string; }
interface BuyerRequest { id: string; buyer: string; location: string; status: string | null; created_at: string; }
interface Scout { id: string; asker: string; question: string; created_at: string; }
interface Analysis { id: string; location: string; user: string | null; status: string | null; created_at: string; }
interface MarketReport { id: string; name: string | null; location: string; paid: boolean; frequency: string | null; status: string | null; created_at: string; }
interface Message { id: string; conversation_id: string | null; participants: string; sender: string; preview: string; created_at: string; }

interface Overview {
  totals: Totals;
  signups: Signup[]; listings: Listing[]; buyerRequests: BuyerRequest[];
  scout: Scout[]; analysis: Analysis[]; marketReports: MarketReport[]; messages: Message[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function money(n: number | null): string {
  return n == null ? '—' : '$' + Number(n).toLocaleString();
}
function statusPill(status: string | null): string {
  switch (status) {
    case 'active': case 'sent': case 'completed': case 'paid': return 'bg-emerald-50 text-emerald-700';
    case 'pending_review': case 'pending': return 'bg-amber-50 text-amber-700';
    case 'sold': return 'bg-blue-50 text-blue-700';
    case 'rejected': case 'failed': return 'bg-red-50 text-red-700';
    default: return 'bg-surface-container text-on-surface/50';
  }
}

// ─── Reusable UI ─────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, sub }: {
  label: string; value: number | null; icon: string; color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/10 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-none ${color}`}>
        <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold font-headline text-on-surface leading-none">
          {value === null ? <span className="inline-block w-12 h-7 bg-surface-container animate-pulse rounded" /> : value.toLocaleString()}
        </p>
        <p className="text-xs text-on-surface/60 font-medium mt-1">{label}</p>
        {sub && <p className="text-[10px] text-on-surface/35 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Section({ title, icon, count, viewAllHref, viewAllLabel, loading, empty, children }: {
  title: string; icon: string; count: number | null; viewAllHref?: string; viewAllLabel?: string;
  loading: boolean; empty: boolean; children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-on-surface/50 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          <h2 className="font-headline text-base font-bold text-on-surface">{title}</h2>
          {count !== null && (
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full">{count.toLocaleString()}</span>
          )}
        </div>
        {viewAllHref && (
          <a href={viewAllHref} className="text-xs font-semibold text-primary hover:underline whitespace-nowrap">{viewAllLabel ?? 'View all'} →</a>
        )}
      </div>
      <div className="bg-white border border-outline-variant/10 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="animate-pulse flex gap-4 items-center">
                <div className="h-4 bg-surface-container rounded flex-1" />
                <div className="h-4 bg-surface-container rounded w-24" />
              </div>
            ))}
          </div>
        ) : empty ? (
          <div className="p-8 text-center text-on-surface/40 text-sm">No activity yet</div>
        ) : (
          <ul className="divide-y divide-outline-variant/10">{children}</ul>
        )}
      </div>
    </section>
  );
}

function Row({ primary, secondary, meta, time, pill, pillClass }: {
  primary: React.ReactNode; secondary?: React.ReactNode; meta?: React.ReactNode;
  time: string; pill?: string | null; pillClass?: string;
}) {
  return (
    <li className="flex items-center gap-4 px-5 py-3 hover:bg-surface-container-lowest transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-on-surface truncate">{primary}</p>
          {pill && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-none ${pillClass ?? 'bg-surface-container text-on-surface/50'}`}>{pill}</span>}
        </div>
        {secondary && <p className="text-xs text-on-surface/55 truncate mt-0.5">{secondary}</p>}
      </div>
      {meta && <div className="flex-none text-xs text-on-surface/60 text-right whitespace-nowrap">{meta}</div>}
      <div className="flex-none text-[11px] text-on-surface/40 text-right whitespace-nowrap w-24" title={fmtDate(time)}>{relTime(time)}</div>
    </li>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/dashboard/overview', { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? 'Failed to load'); }
      else { setData(d); setError(null); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const t = data?.totals ?? null;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Admin Dashboard</h1>
          <p className="text-on-surface/50 mt-1 text-sm">Live activity across LotScout — every signup, listing, buyer request, message, and Scout question.</p>
        </div>
        <button
          onClick={load}
          className="flex-none flex items-center gap-1.5 text-xs font-semibold text-on-surface/60 hover:text-on-surface border border-outline-variant/20 rounded-lg px-3 py-2 bg-white transition-colors"
        >
          <span className="material-symbols-outlined text-base">refresh</span> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Failed to load dashboard: {error}</div>
      )}

      {/* ── STEP 4: Top summary stats ── */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">At a glance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard label="Total Users" value={t?.users ?? null} icon="group" color="bg-blue-600" />
          <StatCard label="Total Listings" value={t?.listings ?? null} icon="home_work" color="bg-emerald-600" />
          <StatCard label="Buyer Requests" value={t?.buyerRequests ?? null} icon="person_search" color="bg-orange-500" />
          <StatCard label="Total Messages" value={t?.messages ?? null} icon="forum" color="bg-violet-600" sub={t ? `${t.conversations} conversations` : undefined} />
          <StatCard label="Scout Questions" value={t?.scoutQuestions ?? null} icon="smart_toy" color="bg-teal-600" />
          <StatCard label="New Signups (7d)" value={t?.newUsers7d ?? null} icon="trending_up" color="bg-rose-500" />
        </div>
      </section>

      {/* ── Needs attention (compact) ── */}
      <section className="mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a href="/admin/listings" className="group bg-white border border-outline-variant/10 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-500" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
            <div className="flex-1"><p className="text-sm font-semibold text-on-surface">Pending Listings</p><p className="text-xs text-on-surface/50">Review submissions</p></div>
            <span className="text-lg font-extrabold font-headline text-on-surface">{t?.pendingListings ?? '—'}</span>
          </a>
          <a href="/admin/analysis" className="group bg-white border border-outline-variant/10 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all flex items-center gap-3">
            <span className="material-symbols-outlined text-purple-500" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            <div className="flex-1"><p className="text-sm font-semibold text-on-surface">Pending Analysis</p><p className="text-xs text-on-surface/50">Property reports</p></div>
            <span className="text-lg font-extrabold font-headline text-on-surface">{t?.pendingAnalysis ?? '—'}</span>
          </a>
          <a href="/buyer-directory" className="group bg-white border border-outline-variant/10 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
            <div className="flex-1"><p className="text-sm font-semibold text-on-surface">Pending Buyers</p><p className="text-xs text-on-surface/50">Buyer requests</p></div>
            <span className="text-lg font-extrabold font-headline text-on-surface">{t?.pendingBuyerRequests ?? '—'}</span>
          </a>
        </div>
      </section>

      {/* ── 1. New Signups ── */}
      <Section title="New Signups" icon="person_add" count={t?.users ?? null} viewAllHref="/admin/users" loading={loading} empty={(data?.signups.length ?? 0) === 0}>
        {data?.signups.map(s => (
          <Row key={s.id}
            primary={s.name}
            secondary={s.email}
            meta={s.source ? <span className="text-on-surface/40">{s.source}</span> : undefined}
            time={s.created_at}
          />
        ))}
      </Section>

      {/* ── 2. New Listings ── */}
      <Section title="New Listings" icon="home_work" count={t?.listings ?? null} viewAllHref="/admin/listings" loading={loading} empty={(data?.listings.length ?? 0) === 0}>
        {data?.listings.map(l => (
          <Row key={l.id}
            primary={l.title}
            secondary={<>{l.seller} · {l.location}</>}
            meta={<span className="font-semibold text-on-surface/70">{money(l.price)}</span>}
            time={l.created_at}
            pill={l.status} pillClass={statusPill(l.status)}
          />
        ))}
      </Section>

      {/* ── 3. New Buyer Requests ── */}
      <Section title="New Buyer Requests" icon="person_search" count={t?.buyerRequests ?? null} viewAllHref="/buyer-directory" loading={loading} empty={(data?.buyerRequests.length ?? 0) === 0}>
        {data?.buyerRequests.map(b => (
          <Row key={b.id}
            primary={b.buyer}
            secondary={<>Targeting {b.location}</>}
            time={b.created_at}
            pill={b.status} pillClass={statusPill(b.status)}
          />
        ))}
      </Section>

      {/* ── 4. Messages ── */}
      <Section title="Messages" icon="forum" count={t?.messages ?? null} viewAllHref="/admin/messages" viewAllLabel="Open message monitor" loading={loading} empty={(data?.messages.length ?? 0) === 0}>
        {data?.messages.map(m => (
          <Row key={m.id}
            primary={m.participants}
            secondary={<><span className="font-medium text-on-surface/70">{m.sender}:</span> {m.preview}</>}
            time={m.created_at}
          />
        ))}
      </Section>

      {/* ── 5. Scout Usage ── */}
      <Section title="Scout Usage" icon="smart_toy" count={t?.scoutQuestions ?? null} loading={loading} empty={(data?.scout.length ?? 0) === 0}>
        {data?.scout.map(s => (
          <Row key={s.id}
            primary={<span className="font-normal text-on-surface">“{s.question}”</span>}
            secondary={<>Asked by {s.asker}</>}
            time={s.created_at}
          />
        ))}
      </Section>

      {/* ── 6. Other activity: Property Analysis + Market Reports ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Property Analysis Requests" icon="query_stats" count={t?.analysisRequests ?? null} viewAllHref="/admin/analysis" loading={loading} empty={(data?.analysis.length ?? 0) === 0}>
          {data?.analysis.map(a => (
            <Row key={a.id}
              primary={a.location}
              secondary={a.user ?? undefined}
              time={a.created_at}
              pill={a.status} pillClass={statusPill(a.status)}
            />
          ))}
        </Section>

        <Section title="Market Report Requests" icon="summarize" count={t?.marketReports ?? null} loading={loading} empty={(data?.marketReports.length ?? 0) === 0}>
          {data?.marketReports.map(m => (
            <Row key={m.id}
              primary={m.name ?? '—'}
              secondary={<>{m.location}{m.frequency ? ` · ${m.frequency}` : ''}</>}
              meta={m.paid ? <span className="text-emerald-600 font-semibold">Paid</span> : <span className="text-on-surface/40">Free</span>}
              time={m.created_at}
              pill={m.status} pillClass={statusPill(m.status)}
            />
          ))}
        </Section>
      </div>

      {/* Footnote: emails tracked */}
      {t && (
        <p className="text-center text-xs text-on-surface/35 mt-4">
          {t.emails.toLocaleString()} emails logged · {t.analysisRequests} analysis requests · {t.marketReports} market report requests
        </p>
      )}
    </div>
  );
}
