'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { STATE_MAP } from '@/lib/stateMap';
import Link from 'next/link';

type FormState = 'idle' | 'loading' | 'success' | 'already_requested' | 'error';

export default function MarketReportsPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [county, setCounty] = useState('');
  const [state, setState] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const stateEntries = Object.entries(STATE_MAP); // [fullName, abbrev]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/market-reports/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, county, state }),
      });

      if (res.ok) {
        setFormState('success');
      } else if (res.status === 409) {
        setFormState('already_requested');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.error || 'Something went wrong. Please try again.');
        setFormState('error');
      }
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setFormState('error');
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#1B4332] mb-3">
            Free County Land Market Report
          </h1>
          <p className="text-secondary text-lg max-w-2xl mx-auto">
            Get an AI-powered analysis of your target county — price trends, permit activity,
            and investment outlook — delivered straight to your inbox.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left: Value props + pricing */}
          <div className="space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-[#1B4332] mb-4">What\'s in your report</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 mt-0.5 text-lg">✓</span>
                  <span className="text-on-surface">County-level price per acre trends</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 mt-0.5 text-lg">✓</span>
                  <span className="text-on-surface">Recent rezoning &amp; permit activity</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 mt-0.5 text-lg">✓</span>
                  <span className="text-on-surface">AI-powered investment outlook</span>
                </li>
              </ul>
            </div>

            {/* Pricing card */}
            <div className="bg-[#1B4332] text-white rounded-2xl p-6">
              <div className="text-2xl font-bold mb-1">$9<span className="text-base font-normal">/mo per county</span></div>
              <p className="text-emerald-200 text-sm mb-4">
                Get monthly reports delivered automatically — never miss a market shift.
              </p>
              <Link
                href="/pricing"
                className="inline-block bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                See Subscription Plans →
              </Link>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
            {formState === 'success' ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✓</div>
                <h2 className="text-xl font-semibold text-[#1B4332] mb-2">
                  Check your email!
                </h2>
                <p className="text-on-surface font-medium mb-1">
                  Your {county}, {state} report is on its way.
                </p>
                <p className="text-secondary text-sm">
                  Reports typically arrive within 5–10 minutes. Check your spam folder if you don\'t see it.
                </p>
              </div>
            ) : formState === 'already_requested' ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">📬</div>
                <h2 className="text-xl font-semibold text-[#1B4332] mb-2">
                  Already claimed!
                </h2>
                <p className="text-on-surface mb-4">
                  You\'ve already claimed your free report for this email. Want monthly updates?
                </p>
                <Link
                  href="/pricing"
                  className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Subscribe for $9/mo per county →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Get your free report</h2>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Smith"
                      className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">County Name</label>
                  <input
                    type="text"
                    required
                    value={county}
                    onChange={e => setCounty(e.target.value)}
                    placeholder="e.g. Travis"
                    className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">State</label>
                  <select
                    required
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">Select a state…</option>
                    {stateEntries.map(([fullName, abbrev]) => (
                      <option key={abbrev} value={fullName}>
                        {fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {formState === 'error' && (
                  <p className="text-red-600 text-sm">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={formState === 'loading'}
                  className="w-full bg-[#1B4332] hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  {formState === 'loading' ? 'Sending…' : 'Get My Free Report →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
