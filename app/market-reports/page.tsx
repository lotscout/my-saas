'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { STATE_MAP } from '@/lib/stateMap';

const STATE_ENTRIES = Object.entries(STATE_MAP).sort(([a], [b]) => a.localeCompare(b));

const VALUE_PROPS = [
  {
    icon: 'gavel',
    title: 'Zoning Activity',
    desc: 'Recent rezoning approvals, pending applications, and variance requests that signal where development pressure is building in your target county.',
  },
  {
    icon: 'show_chart',
    title: 'Price Per Acre Trends',
    desc: 'Median land sale prices, 12-month appreciation rates, and comparable closed transactions for vacant parcels in your area.',
  },
  {
    icon: 'psychology',
    title: 'AI Investment Outlook',
    desc: 'A plain-English summary of demand signals, infrastructure investments, employer changes, and what to watch in the coming quarter.',
  },
];

type FormState = 'idle' | 'loading' | 'success' | 'already_requested' | 'error';

export default function MarketReportsPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [state, setState]         = useState('');
  const [county, setCounty]       = useState('');
  const [countyError, setCountyError] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg]   = useState('');

  const [submittedCounty, setSubmittedCounty] = useState('');
  const [submittedState, setSubmittedState]   = useState('');

  function handleStateChange(newState: string) {
    setState(newState);
    setCounty('');
    setCountyError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState('loading');
    setErrorMsg('');
    setCountyError('');
    setSubmittedCounty(county);
    setSubmittedState(state);

    try {
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

      if (res.ok) {
        setFormState('success');
      } else if (res.status === 409) {
        setFormState('already_requested');
      } else {
        const data = await res.json().catch(() => ({}));
        if (data?.error === 'invalid_county') {
          setCountyError(data.message);
          setFormState('idle');
          return;
        }
        setErrorMsg(data?.message || data?.error || 'Something went wrong. Please try again.');
        setFormState('error');
      }
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setFormState('error');
    }
  }

  const displayCounty = submittedCounty.toLowerCase().includes('county')
    ? submittedCounty
    : `${submittedCounty} County`;

  return (
    <div className="min-h-screen bg-white font-body">
      <Header />

      {/* ── Hero ── */}
      <section className="pt-24 pb-3 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-2 text-green-700">
          LotScout Market Reports
        </h1>
        <p className="text-gray-500 text-base max-w-xl mx-auto">
          Get your first county-level land market report for free.
        </p>
        <p className="text-gray-500 text-base max-w-xl mx-auto">
          No account required.
        </p>
      </section>

      {/* ── Form card ── */}
      <section className="px-4 pb-16 mt-4">

        {formState === 'success' ? (
          /* ── Success state ── */
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#DCFCE7' }}>
              <span className="material-symbols-outlined text-3xl" style={{ color: '#1D9E75', fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <h2 className="text-2xl font-extrabold mb-3" style={{ color: '#0D1F16' }}>Check your email!</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Your <strong>{displayCounty}, {submittedState}</strong> land market report is on its way.
            </p>
            <p className="text-gray-500 text-sm text-center leading-relaxed">
              Your report will be delivered within 20 to 30 minutes. Our system carefully gathers and analyzes real county data, zoning records, permit activity, and market intelligence to give you the most accurate and useful report possible. Sit tight and check your inbox soon.
            </p>
          </div>

        ) : formState === 'already_requested' ? (
          /* ── Already requested state ── */
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow border border-gray-100 p-8 text-center">
            <h2 className="text-xl font-bold mb-3" style={{ color: '#0D1F16' }}>You have already received your free report.</h2>
            <p className="text-sm text-gray-500 mb-4">
              Subscribe for $9/mo to keep getting monthly updates for {displayCounty}, {submittedState}.
            </p>
            <Link href="/market-reports/subscribe" className="text-sm font-semibold" style={{ color: '#1D9E75' }}>
              Subscribe →
            </Link>
          </div>

        ) : (
          /* ── Form ── */
          <div className="max-w-[500px] mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-5">
              <form onSubmit={handleSubmit} className="space-y-2">

                {/* 1. First Name + Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#1D9E75' } as React.CSSProperties}
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
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 2. Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                  />
                </div>

                {/* 3. State */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">State</label>
                  <select
                    required
                    value={state}
                    onChange={e => handleStateChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
                  >
                    <option value="">Select a state&hellip;</option>
                    {STATE_ENTRIES.map(([name, abbr]) => (
                      <option key={abbr} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* 4. County free-text */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">County</label>
                  <input
                    type="text"
                    required
                    disabled={!state}
                    value={county}
                    onChange={e => { setCounty(e.target.value); setCountyError(''); }}
                    placeholder={state ? 'e.g. Denver County, Douglas County' : 'Select a state first'}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ '--tw-ring-color': '#1D9E75' } as React.CSSProperties}
                    autoComplete="off"
                  />
                  {countyError && (
                    <p className="text-xs text-red-600 mt-1">{countyError}</p>
                  )}
                </div>

                {formState === 'error' && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    {errorMsg}
                  </p>
                )}

                {/* 5. Submit */}
                <button
                  type="submit"
                  disabled={formState === 'loading'}
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {formState === 'loading' ? (
                    'Sending…'
                  ) : (
                    <>
                      Get My Free Report
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-3 leading-relaxed">
                By submitting, you agree to receive automated land market insights.
                We value your privacy and do not share your data with third-party brokers.
              </p>
            </div>
          </div>
        )}

      </section>

      {/* ── Value props ── */}
      <section className="py-16 px-4" style={{ background: '#F8FAF9' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-center mb-2" style={{ color: '#0D1F16' }}>
            What&apos;s in your report
          </h2>
          <p className="text-gray-500 text-sm text-center mb-10">
            Every report covers three key intelligence areas for your county.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUE_PROPS.map(({ icon, title, desc }) => (
              <div key={title} className="text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: '#DCFCE7' }}
                >
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={{ color: '#1D9E75', fontVariationSettings: "'FILL' 1" }}
                  >
                    {icon}
                  </span>
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: '#0D1F16' }}>{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-16 px-4 text-center" style={{ background: '#0D1F16' }}>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400 mb-3">
          Already a LotScout member?
        </p>
        <p className="text-white/70 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
          Monthly market reports are included free with every paid LotScout plan.
        </p>
        <Link
          href="/pricing"
          className="inline-block border-2 border-white text-white font-bold px-8 py-3 rounded-xl text-sm"
          style={{ borderColor: 'rgba(255,255,255,0.4)' }}
        >
          View Plans
        </Link>
      </section>
    </div>
  );
}
