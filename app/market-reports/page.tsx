'use client';

import { useState } from 'react';
import Link from 'next/link';
import { STATE_MAP } from '@/lib/stateMap';

const STATE_ENTRIES = Object.entries(STATE_MAP).sort(([a], [b]) => a.localeCompare(b));

const VALUE_PROPS = [
  {
    icon: 'gavel',
    title: 'Zoning Activity',
    body: 'Recent zoning changes and permit trends that affect land values in your target county.',
  },
  {
    icon: 'show_chart',
    title: 'Price Per Acre Trends',
    body: 'Median sale prices, 12-month appreciation rates, and recent comparable transactions.',
  },
  {
    icon: 'psychology',
    title: 'AI Investment Outlook',
    body: 'Plain-English summary of demand signals, growth catalysts, and what to watch next quarter.',
  },
];

type FormStatus = 'idle' | 'loading' | 'success' | 'already_requested';

export default function MarketReportsPage() {
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [email, setEmail]           = useState('');
  const [county, setCounty]         = useState('');
  const [state, setState]           = useState('');
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [result, setResult]         = useState<{ county: string; state: string } | null>(null);
  const [error, setError]           = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFormStatus('loading');

    const res = await fetch('/api/market-reports/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        email:      email.trim(),
        county:     county.trim(),
        state,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      if (data.error === 'already_requested') {
        setFormStatus('already_requested');
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.');
        setFormStatus('idle');
      }
      return;
    }

    setResult({ county: data.county, state: data.state });
    setFormStatus('success');
  }

  return (
    <div className="min-h-screen bg-white font-body">

      {/* ── Hero ── */}
      <section className="bg-[#012d1d] pt-28 pb-20 px-4 text-center">
        <span className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-4 py-1.5 mb-6">
          The #1 Platform for Land Data and Off-Market Deals
        </span>
        <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Land Market Reports
        </h1>
        <p className="text-white/70 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
          Get your first report for free. No account required.
        </p>
      </section>

      {/* ── Form / Confirmation card ── */}
      <section className="px-4 -mt-10 mb-20">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {formStatus === 'success' && result ? (
            /* ── Confirmation state ── */
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <span
                  className="material-symbols-outlined text-emerald-700 text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>
              <h2 className="font-headline text-2xl font-extrabold text-[#012d1d] mb-3">
                Check your email!
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-8">
                Your <strong>{result.county}, {result.state}</strong> land market report is on its way.
              </p>
              <Link
                href="/marketplace"
                className="inline-block w-full bg-[#1B4332] text-white font-bold py-3 rounded-xl hover:bg-[#012d1d] transition-colors text-sm"
              >
                Browse the Marketplace
              </Link>
            </div>
          ) : (
            /* ── Request form ── */
            <div className="p-8">
              <h2 className="font-headline text-xl font-bold text-[#012d1d] mb-6">
                Request your free report
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Smith"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700/40 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700/40 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">County Name</label>
                  <input
                    type="text"
                    required
                    value={county}
                    onChange={e => setCounty(e.target.value)}
                    placeholder="e.g. Franklin County"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700/40 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">State</label>
                  <select
                    required
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700/40 transition-colors"
                  >
                    <option value="">Select a state…</option>
                    {STATE_ENTRIES.map(([name, abbr]) => (
                      <option key={abbr} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {formStatus === 'already_requested' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                    You have already received your free report.{' '}
                    <Link href="/market-reports/subscribe" className="font-semibold underline hover:text-amber-900">
                      Subscribe for $9/mo
                    </Link>{' '}
                    to keep getting monthly updates.
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formStatus === 'loading'}
                  className="w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {formStatus === 'loading' ? 'Submitting…' : 'Get My Free Report'}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                By submitting you agree to receive your report and occasional updates from LotScout.
                Unsubscribe anytime.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Value props ── */}
      <section className="max-w-4xl mx-auto px-4 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {VALUE_PROPS.map(({ icon, title, body }) => (
            <div key={title} className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span
                  className="material-symbols-outlined text-emerald-700 text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {icon}
                </span>
              </div>
              <h3 className="font-headline font-bold text-[#012d1d] text-base mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-sm mx-auto text-center">
          <h2 className="font-headline text-2xl font-extrabold text-[#012d1d] mb-2">
            Want monthly updates?
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Stay ahead of the market with ongoing county intelligence.
          </p>

          <div className="bg-white border-2 border-green-700 rounded-2xl p-8 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2">Monthly Plan</p>
            <p className="font-headline text-4xl font-extrabold text-[#012d1d] mb-1">
              $9<span className="text-base font-semibold text-gray-500">/mo per county</span>
            </p>
            <p className="text-gray-500 text-sm mb-6">One report per month for your county</p>
            <Link
              href="/market-reports/subscribe"
              className="block w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors text-sm"
            >
              Subscribe
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-16 px-4 text-center">
        <p className="text-gray-500 text-sm mb-3">Already a LotScout member?</p>
        <Link
          href="/pricing"
          className="inline-block border-2 border-[#1B4332] text-[#1B4332] font-bold px-8 py-3 rounded-xl hover:bg-[#1B4332] hover:text-white transition-colors text-sm"
        >
          View Plans
        </Link>
      </section>

    </div>
  );
}
