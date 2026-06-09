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

  const stateEntries = Object.entries(STATE_MAP);

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

      <main className="max-w-lg mx-auto px-4 pt-28 pb-16">
        {/* Hero */}
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-3">LotScout Market Reports</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-3">
            Free County Land Market Report
          </h1>
          <p className="text-secondary text-base max-w-md mx-auto">
            AI-powered analysis of price trends, permit activity, and investment outlook — delivered to your inbox in minutes.
          </p>
        </div>

        {/* Single form card */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-7 shadow-sm">
          {formState === 'success' ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-emerald-600 text-2xl">✓</span>
              </div>
              <h2 className="text-xl font-bold text-primary mb-2">Check your email!</h2>
              <p className="text-on-surface font-medium mb-1">{county}, {state} report is on its way.</p>
              <p className="text-secondary text-sm">Usually arrives within 5–10 minutes. Check your spam if you don&apos;t see it.</p>
            </div>
          ) : formState === 'already_requested' ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-xl font-bold text-primary mb-2">Already claimed!</h2>
              <p className="text-secondary mb-5">You&apos;ve already received a free report for this email.</p>
              <Link
                href="/pricing"
                className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Subscribe for $9/mo →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">First Name</label>
                  <input
                    type="text" required value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full border border-outline-variant rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Last Name</label>
                  <input
                    type="text" required value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Smith"
                    className="w-full border border-outline-variant rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Email</label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full border border-outline-variant rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">County Name</label>
                <input
                  type="text" required value={county}
                  onChange={e => setCounty(e.target.value)}
                  placeholder="e.g. Travis"
                  className="w-full border border-outline-variant rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">State</label>
                <select
                  required value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full border border-outline-variant rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">Select a state…</option>
                  {stateEntries.map(([fullName, abbrev]) => (
                    <option key={abbrev} value={fullName}>{fullName}</option>
                  ))}
                </select>
              </div>

              {formState === 'error' && (
                <p className="text-red-600 text-sm">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={formState === 'loading'}
                className="w-full bg-[#1B4332] hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm mt-2"
              >
                {formState === 'loading' ? 'Sending…' : 'Get My Free Report →'}
              </button>

              <p className="text-center text-xs text-secondary">
                Free, no credit card required.{' '}
                <Link href="/pricing" className="text-emerald-600 hover:underline">Subscribe $9/mo</Link>
                {' '}for monthly updates.
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
