'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { STATE_MAP } from '@/lib/stateMap';

const STATE_NAMES = Object.keys(STATE_MAP).sort();

const VALUE_PROPS = [
  {
    icon: 'gavel',
    title: 'County Zoning Activity',
    body: 'Recent zoning changes, permit trends, and regulatory shifts that affect land values in your target county.',
  },
  {
    icon: 'show_chart',
    title: 'Price Per Acre Trends',
    body: 'Median sale prices, 12-month appreciation rates, and comparable recent transactions for your area.',
  },
  {
    icon: 'psychology',
    title: 'AI Investment Outlook',
    body: 'A plain-English summary of demand signals, growth catalysts, and what to watch in the coming quarter.',
  },
];

type FormState = 'idle' | 'loading' | 'success' | 'subscribe';

export default function MarketReportsPage() {
  const [county, setCounty]   = useState('');
  const [state, setState]     = useState('');
  const [email, setEmail]     = useState('');
  const [status, setStatus]   = useState<FormState>('idle');
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus('loading');

    const res = await fetch('/api/market-reports/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ county: county.trim(), state, email: email.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.');
      setStatus('idle');
      return;
    }

    if (data.subscribe) {
      setStatus('subscribe');
    } else {
      setStatus('success');
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body">
      <Header />

      <main className="flex-grow pt-24 pb-20 px-4">

        {/* ── Page heading ── */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-3">LotScout Research</p>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-primary tracking-tight leading-tight mb-4">
            Land Market Reports
          </h1>
          <p className="text-secondary text-lg leading-relaxed">
            Get a free county-level land market report delivered to your inbox.
            No account required.
          </p>
        </div>

        {/* ── Report request form ── */}
        <div className="max-w-lg mx-auto mb-20">

          {status === 'success' ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-emerald-700 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  mark_email_read
                </span>
              </div>
              <h2 className="font-headline text-2xl font-bold text-primary mb-2">Report on its way!</h2>
              <p className="text-secondary text-sm leading-relaxed">
                We&apos;re generating your free land market report for{' '}
                <strong>{county}, {state}</strong>. Check your inbox — it&apos;ll arrive shortly.
              </p>
              <button
                onClick={() => { setStatus('idle'); setCounty(''); setState(''); setEmail(''); }}
                className="mt-6 text-sm text-emerald-700 font-semibold hover:underline"
              >
                Request another county
              </button>
            </div>
          ) : status === 'subscribe' ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-amber-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lock
                </span>
              </div>
              <h2 className="font-headline text-xl font-bold text-primary mb-2">You&apos;ve used your free report</h2>
              <p className="text-secondary text-sm leading-relaxed mb-6">
                Your first report is free. To get ongoing updates for{' '}
                <strong>{county}, {state}</strong>, choose a plan below.
              </p>
              <Link
                href="/market-reports/subscribe"
                className="inline-block w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors text-sm"
              >
                View Plans &rarr;
              </Link>
              <button
                onClick={() => setStatus('idle')}
                className="mt-3 text-xs text-on-surface/40 hover:text-on-surface/70 transition-colors"
              >
                Go back
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              <h2 className="font-headline text-xl font-bold text-primary mb-6">Request your free report</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="county" className="block text-sm font-semibold text-on-surface mb-1.5">
                    County
                  </label>
                  <input
                    id="county"
                    type="text"
                    required
                    value={county}
                    onChange={e => setCounty(e.target.value)}
                    placeholder="e.g. Franklin County"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700/40 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-semibold text-on-surface mb-1.5">
                    State
                  </label>
                  <select
                    id="state"
                    required
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-on-surface focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700/40 transition-colors text-sm"
                  >
                    <option value="">Select a state…</option>
                    {STATE_NAMES.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-on-surface mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700/40 transition-colors text-sm"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 font-medium bg-red-50 px-4 py-3 rounded-xl">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
                >
                  {status === 'loading' ? 'Submitting…' : 'Get My Free Report'}
                </button>
              </form>

              <p className="text-center text-xs text-on-surface/40 mt-4">
                Your first report is free. No credit card required.
              </p>
            </div>
          )}
        </div>

        {/* ── Value props ── */}
        <section className="max-w-4xl mx-auto mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUE_PROPS.map(({ icon, title, body }) => (
              <div key={title} className="text-center px-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span
                    className="material-symbols-outlined text-emerald-700 text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {icon}
                  </span>
                </div>
                <h3 className="font-headline font-bold text-primary text-base mb-2">{title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing section ── */}
        <section className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-headline text-2xl font-bold text-primary mb-2">Want reports every month?</h2>
            <p className="text-secondary text-sm">Stay ahead of the market with ongoing county intelligence.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Monthly */}
            <div className="border-2 border-green-700 rounded-2xl p-6 bg-white">
              <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2">Monthly</p>
              <p className="font-headline text-3xl font-extrabold text-primary mb-1">
                $9<span className="text-base font-semibold text-secondary">/mo</span>
              </p>
              <p className="text-sm text-secondary mb-6">One report per month for your county</p>
              <Link
                href="/market-reports/subscribe"
                className="block text-center w-full bg-green-700 text-white font-bold py-2.5 rounded-xl hover:bg-green-800 transition-colors text-sm"
              >
                Subscribe
              </Link>
            </div>

            {/* Weekly */}
            <div className="border-2 border-green-700 rounded-2xl p-6 bg-white relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                Most popular
              </span>
              <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2">Weekly</p>
              <p className="font-headline text-3xl font-extrabold text-primary mb-1">
                $29<span className="text-base font-semibold text-secondary">/mo</span>
              </p>
              <p className="text-sm text-secondary mb-6">Weekly updates on your county</p>
              <Link
                href="/market-reports/subscribe"
                className="block text-center w-full bg-green-700 text-white font-bold py-2.5 rounded-xl hover:bg-green-800 transition-colors text-sm"
              >
                Subscribe
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-on-surface/50">
            LotScout Standard, Priority, and Exclusive members get monthly reports free.
          </p>
        </section>

      </main>
    </div>
  );
}
