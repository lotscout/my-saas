'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type AnyRow = Record<string, any>;

type DataCenter = {
  generatedAt: string;
  kpis: Record<string, any>;
  sections: Record<string, AnyRow[]>;
};

const SECTION_META: Record<string, { label: string; icon: string; desc: string }> = {
  users: { label: 'Users & signups', icon: 'group', desc: 'Accounts, tiers, source, role, admin/test flags.' },
  subscriptions: { label: 'Payments & subscriptions', icon: 'payments', desc: 'Stripe subscription state, tiers, renewals, cancellation flags.' },
  listings: { label: 'Listings', icon: 'home_work', desc: 'Marketplace inventory, status, pricing, views, promoted listings.' },
  buyerRequests: { label: 'Buyer requests', icon: 'person_search', desc: 'Demand side activity, budgets, timelines, views.' },
  messages: { label: 'Messages', icon: 'forum', desc: 'Latest conversations and unread/read status.' },
  scout: { label: 'LotScout Search / Scout', icon: 'smart_toy', desc: 'Recent AI questions and usage.' },
  scoutLeads: { label: 'Scout leads', icon: 'mark_email_unread', desc: 'Emails captured after the guest Scout limit.' },
  analyses: { label: 'Property analysis', icon: 'analytics', desc: 'Submitted reports and completion status.' },
  marketReports: { label: 'Market reports', icon: 'summarize', desc: 'Market report requests, status, payment/frequency.' },
  emails: { label: 'Emails & webhook logs', icon: 'mail', desc: 'Resend sends, internal webhook audit logs, status.' },
  searchUsage: { label: 'Free search limits', icon: 'speed', desc: 'Tracked daily free-user Scout usage.' },
  tableHealth: { label: 'Supabase table health', icon: 'database', desc: 'Live counts and API reachability per table.' },
};

const SECTION_ORDER = ['users', 'subscriptions', 'listings', 'buyerRequests', 'messages', 'scout', 'scoutLeads', 'analyses', 'marketReports', 'emails', 'searchUsage', 'tableHealth'];

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function rel(value: string | null | undefined) {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff)) return fmtDate(value);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function money(value: any) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `$${n.toLocaleString()}`;
}

function pillClass(value: any) {
  const v = String(value ?? '').toLowerCase();
  if (['active', 'paid', 'sent', 'completed', 'true', 'processed', 'delivered', 'trialing'].includes(v)) return 'bg-emerald-50 text-emerald-700';
  if (['pending', 'pending_review', 'past_due', 'unread'].includes(v)) return 'bg-amber-50 text-amber-700';
  if (['canceled', 'cancelled', 'deleted', 'failed', 'error', 'rejected', 'false'].includes(v)) return 'bg-red-50 text-red-700';
  if (['standard', 'priority', 'exclusive', 'search_pro'].includes(v)) return 'bg-blue-50 text-blue-700';
  return 'bg-surface-container text-on-surface/60';
}

function Stat({ label, value, sub, icon }: { label: string; value: React.ReactNode; sub?: string; icon: string }) {
  return (
    <div className="bg-white border border-outline-variant/10 rounded-2xl p-4 shadow-sm flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-on-surface leading-none font-headline">{value}</p>
        <p className="text-xs font-semibold text-on-surface/55 mt-1 truncate">{label}</p>
        {sub && <p className="text-[10px] text-on-surface/35 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-outline-variant/10 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#1D9E75] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <h2 className="font-headline font-bold text-on-surface">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function RowValue({ value, kind }: { value: any; kind?: string }) {
  if (value === null || value === undefined || value === '') return <span className="text-on-surface/30">—</span>;
  if (typeof value === 'boolean') return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${pillClass(String(value))}`}>{value ? 'Yes' : 'No'}</span>;
  if (kind === 'date' || /_at$|period_end|created|updated|completed|date/.test(kind ?? '')) return <span title={fmtDate(value)}>{rel(value)}</span>;
  if (kind === 'price' || kind === 'budget' || kind === 'estimatedMonthlyRecurring') return <span>{money(value)}</span>;
  if (kind === 'status' || kind === 'tier' || kind === 'type') return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${pillClass(value)}`}>{String(value)}</span>;
  if (Array.isArray(value)) return <span>{value.filter(v => v !== null && v !== undefined).map(money).join(' – ') || '—'}</span>;
  return <span>{String(value)}</span>;
}

function DataTable({ rows }: { rows: AnyRow[] }) {
  const columns = useMemo(() => {
    const preferred = ['name', 'user', 'buyer', 'seller', 'title', 'email', 'tier', 'status', 'location', 'price', 'budget', 'question', 'preview', 'subject', 'type', 'count', 'views', 'created_at', 'updated_at', 'period_end'];
    const keys = Array.from(new Set(rows.flatMap(row => Object.keys(row)))).filter(k => k !== 'id' && k !== 'user_id');
    return [...preferred.filter(k => keys.includes(k)), ...keys.filter(k => !preferred.includes(k))].slice(0, 9);
  }, [rows]);

  if (!rows.length) return <div className="text-center py-10 text-sm text-on-surface/40">No rows found</div>;

  return (
    <div className="overflow-x-auto -mx-5">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-outline-variant/10 bg-surface-container-lowest">
            {columns.map(col => <th key={col} className="text-left text-[11px] uppercase tracking-widest text-on-surface/40 font-black px-5 py-3 whitespace-nowrap">{col.replace(/_/g, ' ')}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="hover:bg-surface-container-lowest/70">
              {columns.map(col => (
                <td key={col} className="px-5 py-3 max-w-[260px] truncate text-on-surface/75 whitespace-nowrap">
                  <RowValue value={row[col]} kind={col} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDataCenterPage() {
  const [data, setData] = useState<DataCenter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('users');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/data-center', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load data center');
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data center');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  const k = data?.kpis;
  const rows = data?.sections?.[active] ?? [];
  const meta = SECTION_META[active];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-7 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">LotScout Data Center</h1>
            {autoRefresh && <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" /></span>}
          </div>
          <p className="text-on-surface/50 mt-1 text-sm max-w-2xl">Admin-only live view of Supabase: users, payments, listings, signups, buyer demand, messages, Scout usage, reports, emails, and table health.</p>
          <p className="text-on-surface/35 mt-1 text-xs">Last loaded: {data?.generatedAt ? fmtDate(data.generatedAt) : loading ? 'Loading…' : '—'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoRefresh(v => !v)} className={`px-3 py-2 rounded-lg text-xs font-bold border ${autoRefresh ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-white text-on-surface/55 border-outline-variant/20'}`}>
            {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
          </button>
          <button onClick={load} className="px-3 py-2 rounded-lg text-xs font-bold bg-white border border-outline-variant/20 text-on-surface/65 hover:text-on-surface">
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        <Stat label="Users" value={loading ? '—' : k?.users?.total?.toLocaleString() ?? '—'} sub={`${k?.users?.new7d ?? 0} new 7d · ${k?.users?.source ?? 'source'}`} icon="group" />
        <Stat label="MRR" value={loading ? '—' : money(k?.revenue?.estimatedMonthlyRecurring)} sub={`${k?.revenue?.activeSubscriptions ?? 0} active subs · ${k?.revenue?.source ?? 'source'}`} icon="payments" />
        <Stat label="Listings" value={loading ? '—' : k?.marketplace?.listings?.toLocaleString() ?? '—'} sub={`${k?.marketplace?.active ?? 0} active · ${k?.marketplace?.pending ?? 0} pending`} icon="home_work" />
        <Stat label="Buyer Requests" value={loading ? '—' : k?.buyers?.total?.toLocaleString() ?? '—'} sub={`${k?.buyers?.active ?? 0} active`} icon="person_search" />
        <Stat label="Scout Questions" value={loading ? '—' : k?.scout?.questions?.toLocaleString() ?? '—'} sub={`${k?.scout?.questions7d ?? 0} in 7d`} icon="smart_toy" />
        <Stat label="Messages" value={loading ? '—' : k?.messaging?.messages?.toLocaleString() ?? '—'} sub={`${k?.messaging?.unread ?? 0} unread`} icon="forum" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-7">
        <Card title="Revenue" icon="payments">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-xl font-black text-on-surface">{money(k?.revenue?.estimatedMonthlyRecurring)}</p><p className="text-xs text-on-surface/45">est. monthly</p></div>
            <div><p className="text-xl font-black text-on-surface">{k?.users?.paidProfiles ?? 0}</p><p className="text-xs text-on-surface/45">paid customers</p></div>
            <div><p className="text-xl font-black text-on-surface">{k?.users?.searchOnly ?? 0}</p><p className="text-xs text-on-surface/45">Search add-ons</p></div>
          </div>
        </Card>
        <Card title="Needs attention" icon="priority_high">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-xl font-black text-amber-700">{k?.marketplace?.pending ?? 0}</p><p className="text-xs text-on-surface/45">listings</p></div>
            <div><p className="text-xl font-black text-amber-700">{k?.buyers?.pending ?? 0}</p><p className="text-xs text-on-surface/45">buyers</p></div>
            <div><p className="text-xl font-black text-amber-700">{k?.operations?.pendingAnalysis ?? 0}</p><p className="text-xs text-on-surface/45">reports</p></div>
          </div>
        </Card>
        <Card title="Operations" icon="settings">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-xl font-black text-on-surface">{k?.operations?.emails ?? 0}</p><p className="text-xs text-on-surface/45">emails/logs</p></div>
            <div><p className="text-xl font-black text-on-surface">{k?.operations?.marketReports ?? 0}</p><p className="text-xs text-on-surface/45">market reports</p></div>
            <div><p className="text-xl font-black text-on-surface">{k?.operations?.propertyAnalysis ?? 0}</p><p className="text-xs text-on-surface/45">analysis</p></div>
          </div>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        <aside className="space-y-2">
          {SECTION_ORDER.map(key => {
            const m = SECTION_META[key];
            const count = data?.sections?.[key]?.length ?? 0;
            const selected = active === key;
            return (
              <button key={key} onClick={() => setActive(key)} className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${selected ? 'bg-[#1D9E75] text-white border-[#1D9E75] shadow-sm' : 'bg-white text-on-surface border-outline-variant/10 hover:border-[#1D9E75]/30'}`}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0" }}>{m.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{m.label}</p>
                    <p className={`text-[11px] truncate ${selected ? 'text-white/70' : 'text-on-surface/45'}`}>{count} recent rows</p>
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        <section className="bg-white border border-outline-variant/10 rounded-2xl shadow-sm overflow-hidden min-w-0">
          <div className="px-5 py-4 border-b border-outline-variant/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1D9E75] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                <h2 className="font-headline text-xl font-extrabold text-on-surface">{meta.label}</h2>
              </div>
              <p className="text-xs text-on-surface/45 mt-1">{meta.desc}</p>
            </div>
            <span className="text-xs font-bold text-on-surface/40">{rows.length} recent rows</span>
          </div>
          {loading ? <div className="p-10 text-center text-sm text-on-surface/40">Loading live Supabase data…</div> : <DataTable rows={rows} />}
        </section>
      </div>
    </div>
  );
}
