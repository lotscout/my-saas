'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Totals {
  spend: number;
  leads: number;
  conversions: number;
  cpl: number;
}

interface WeekPoint {
  week: string;
  meta: number;
  linkedin: number;
  other: number;
}

interface FunnelPoint  { stage: string; count: number }
interface PipelinePoint { stage: string; count: number }

interface RoasMetrics {
  totalRevenue: number;
  roas: number;
  cpa: number;
  paybackMonths: number | null;
  ltvCacRatio: number | null;
  avgPlanValue: number;
}

interface AdSpendEntry {
  id: string;
  date: string;
  channel: string;
  campaign_name: string | null;
  spend: number;
  leads: number;
  conversions: number;
  notes: string | null;
  created_at: string;
}

interface MarketingData {
  totals: Totals;
  emailSubscribers: number;
  weeklySpend: WeekPoint[];
  weeklyLeads: WeekPoint[];
  emailFunnel: FunnelPoint[];
  linkedinPipeline: PipelinePoint[];
  roas: RoasMetrics;
  lastEntries: AdSpendEntry[];
  tablesReady: {
    adSpend: boolean;
    emailSubscribers: boolean;
    linkedinOutreach: boolean;
    paymentsLog: boolean;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtMoney(n: number, decimals = 0) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const LINKEDIN_LABELS: Record<string, string> = {
  connected:   'Connected',
  value_sent:  'Value Sent',
  pitched:     'Pitched',
  replied:     'Replied',
  converted:   'Converted',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, color, sub,
}: {
  label: string; value: string | number | null; icon: string; color: string; sub?: string;
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

function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex items-center gap-5 mb-4">
      {items.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm inline-block flex-none" style={{ backgroundColor: color }} />
          <span className="text-xs text-on-surface/50">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  date:          new Date().toISOString().slice(0, 10),
  channel:       'meta',
  campaign_name: '',
  spend:         '',
  leads:         '',
  conversions:   '',
  notes:         '',
};

export default function DashboardMarketingPage() {
  const [data, setData]             = useState<MarketingData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg]       = useState<{ text: string; ok: boolean } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const r = await fetch('/api/admin/dashboard/marketing');
    const d = await r.json();
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const spend = parseFloat(form.spend);
    if (isNaN(spend) || spend < 0) {
      setFormMsg({ text: 'Enter a valid spend amount.', ok: false });
      return;
    }
    setSubmitting(true);
    setFormMsg(null);
    const r = await fetch('/api/admin/dashboard/marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date:          form.date,
        channel:       form.channel,
        campaign_name: form.campaign_name || null,
        spend,
        leads:       parseInt(form.leads)       || 0,
        conversions: parseInt(form.conversions) || 0,
        notes: form.notes || null,
      }),
    });
    const d = await r.json();
    if (r.ok) {
      setForm({ ...EMPTY_FORM, date: form.date });
      setFormMsg({ text: 'Entry saved!', ok: true });
      fetchData();
    } else {
      setFormMsg({ text: d.error ?? 'Failed to save', ok: false });
    }
    setSubmitting(false);
    setTimeout(() => setFormMsg(null), 4000);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const r = await fetch(`/api/admin/dashboard/marketing/${id}`, { method: 'DELETE' });
    if (r.ok) {
      setData(prev => prev ? { ...prev, lastEntries: prev.lastEntries.filter(e => e.id !== id) } : prev);
    }
    setDeletingId(null);
  }

  const d = data;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Marketing</h1>
        <p className="text-on-surface/50 mt-1 text-sm">Ad spend, email subscribers, and acquisition metrics.</p>
      </div>

      {/* ── KPI Row 1: Core metrics ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Acquisition</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Ad Spend"
            value={loading ? null : fmtMoney(d?.totals.spend ?? 0)}
            icon="payments"
            color="bg-emerald-600"
          />
          <StatCard
            label="Total Leads"
            value={loading ? null : (d?.totals.leads ?? 0).toLocaleString()}
            icon="person_add"
            color="bg-blue-600"
          />
          <StatCard
            label="Avg CPL"
            value={loading ? null : fmtMoney(d?.totals.cpl ?? 0)}
            sub="cost per lead"
            icon="trending_down"
            color="bg-slate-500"
          />
          <StatCard
            label="Email Subscribers"
            value={loading ? null : (d?.emailSubscribers ?? 0).toLocaleString()}
            sub="active list"
            icon="mail"
            color="bg-purple-600"
          />
        </div>
      </section>

      {/* ── Charts Row 1: Weekly spend + leads ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Weekly Performance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Weekly Spend */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
            <h3 className="font-semibold text-on-surface text-sm mb-1">Ad Spend by Channel (last 4 weeks)</h3>
            <ChartLegend items={[
              { label: 'Meta',     color: '#1D9E75' },
              { label: 'LinkedIn', color: '#2563EB' },
              { label: 'Other',    color: '#6B7280' },
            ]} />
            {loading ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={176}>
                <BarChart data={d?.weeklySpend ?? []} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    formatter={(v, name) => [fmtMoney(v as number), String(name)]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Bar dataKey="meta"     name="Meta"     fill="#1D9E75" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="linkedin" name="LinkedIn" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="other"    name="Other"    fill="#6B7280" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Weekly Leads */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
            <h3 className="font-semibold text-on-surface text-sm mb-1">Leads by Channel (last 4 weeks)</h3>
            <ChartLegend items={[
              { label: 'Meta',     color: '#1D9E75' },
              { label: 'LinkedIn', color: '#2563EB' },
              { label: 'Other',    color: '#6B7280' },
            ]} />
            {loading ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={176}>
                <BarChart data={d?.weeklyLeads ?? []} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <Tooltip
                    formatter={(v, name) => [(v as number).toLocaleString(), String(name)]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Bar dataKey="meta"     name="Meta"     fill="#1D9E75" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="linkedin" name="LinkedIn" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="other"    name="Other"    fill="#6B7280" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* ── Charts Row 2: Email funnel + LinkedIn pipeline ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Pipelines</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Email Funnel */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
            <h3 className="font-semibold text-on-surface text-sm mb-5">Email Funnel</h3>
            {loading ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={176}>
                <BarChart
                  data={d?.emailFunnel ?? []}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="stage"
                    type="category"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={68}
                  />
                  <Tooltip
                    formatter={(v) => [(v as number).toLocaleString(), 'Count']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Bar dataKey="count" name="Count" fill="#1D9E75" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <p className="text-xs text-on-surface/30 mt-3 italic">
              Opened / Clicked / Converted will populate after ConvertKit API integration.
            </p>
          </div>

          {/* LinkedIn Outreach Pipeline */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6">
            <h3 className="font-semibold text-on-surface text-sm mb-5">LinkedIn Outreach Pipeline</h3>
            {loading ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={176}>
                <BarChart
                  data={(d?.linkedinPipeline ?? []).map(p => ({ ...p, label: LINKEDIN_LABELS[p.stage] ?? p.stage }))}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="label"
                    type="category"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    formatter={(v) => [(v as number).toLocaleString(), 'Contacts']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Bar dataKey="count" name="Contacts" fill="#2563EB" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* ── KPI Row 2: ROAS metrics ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Return on Ad Spend</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="ROAS"
            value={loading ? null : (d?.roas.roas ? `${d.roas.roas.toFixed(1)}x` : '0x')}
            sub="revenue / spend"
            icon="show_chart"
            color="bg-emerald-600"
          />
          <StatCard
            label="CPA"
            value={loading ? null : (d?.roas.cpa ? fmtMoney(d.roas.cpa) : '$0')}
            sub="cost per acquisition"
            icon="savings"
            color="bg-blue-600"
          />
          <StatCard
            label="Payback Period"
            value={loading ? null : (d?.roas.paybackMonths != null ? `${d.roas.paybackMonths.toFixed(1)} mo` : '—')}
            sub="CPA ÷ avg plan value"
            icon="schedule"
            color="bg-slate-500"
          />
          <StatCard
            label="LTV : CAC"
            value={loading ? null : (d?.roas.ltvCacRatio != null ? `${Math.round(d.roas.ltvCacRatio)}x` : '—')}
            sub="6-month LTV ÷ CPA"
            icon="balance"
            color="bg-purple-600"
          />
        </div>
      </section>

      {/* ── Manual Ad Spend Entry Form ── */}
      <section>
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Log Ad Spend</h2>
        <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-6 mb-4">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-on-surface/60 mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Channel */}
              <div>
                <label className="block text-xs font-semibold text-on-surface/60 mb-1.5">Channel</label>
                <select
                  value={form.channel}
                  onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="meta">Meta</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Campaign name */}
              <div>
                <label className="block text-xs font-semibold text-on-surface/60 mb-1.5">Campaign Name <span className="text-on-surface/30 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={form.campaign_name}
                  onChange={e => setForm(f => ({ ...f, campaign_name: e.target.value }))}
                  placeholder="e.g. TX Landowners May"
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Spend */}
              <div>
                <label className="block text-xs font-semibold text-on-surface/60 mb-1.5">Spend ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.spend}
                  onChange={e => setForm(f => ({ ...f, spend: e.target.value }))}
                  placeholder="0.00"
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Leads */}
              <div>
                <label className="block text-xs font-semibold text-on-surface/60 mb-1.5">Leads</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.leads}
                  onChange={e => setForm(f => ({ ...f, leads: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Conversions */}
              <div>
                <label className="block text-xs font-semibold text-on-surface/60 mb-1.5">Conversions</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.conversions}
                  onChange={e => setForm(f => ({ ...f, conversions: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-on-surface/60 mb-1.5">Notes <span className="text-on-surface/30 font-normal">(optional)</span></label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Any context about this week's spend…"
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Save Entry'}
              </button>
              {formMsg && (
                <span className={`text-sm font-medium ${formMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formMsg.text}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Last 5 entries */}
        {!loading && (d?.lastEntries ?? []).length > 0 && (
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/10">
              <h3 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest">Recent Entries</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                    {['Date', 'Channel', 'Campaign', 'Spend', 'Leads', 'Conversions', ''].map(h => (
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
                  {(d?.lastEntries ?? []).map(entry => (
                    <tr key={entry.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-5 py-3.5 text-on-surface/70 whitespace-nowrap">{fmtDate(entry.date)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          entry.channel === 'meta'
                            ? 'bg-emerald-100 text-emerald-700'
                            : entry.channel === 'linkedin'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {entry.channel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-on-surface/60 max-w-[180px] truncate">
                        {entry.campaign_name ?? <span className="text-on-surface/30">—</span>}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-on-surface whitespace-nowrap">
                        {fmtMoney(Number(entry.spend))}
                      </td>
                      <td className="px-5 py-3.5 text-on-surface/70">{entry.leads}</td>
                      <td className="px-5 py-3.5 text-on-surface/70">{entry.conversions}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingId === entry.id}
                          className="p-1.5 rounded-lg text-on-surface/30 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Delete entry"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
