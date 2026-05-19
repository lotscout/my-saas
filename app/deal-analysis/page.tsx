'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { usePermissions } from '@/hooks/usePermissions';
import { createClient } from '@/lib/supabase/client';

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming',
];

const inputClass =
  'w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm';
const selectClass = `${inputClass} cursor-pointer`;
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function DealAnalysisPage() {
  const { tier, loading: permLoading, profile } = usePermissions();

  const [address, setAddress] = useState('');
  const [apn, setApn] = useState('');
  const [county, setCounty] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');

  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const deliveryTime =
    tier === 'exclusive' ? '15 minutes' : '24 hours';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim() || !state) return;

    setSubmitState('loading');
    setErrorMsg('');

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const res = await fetch('/api/deal-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          apn: apn.trim(),
          county: county.trim(),
          state,
          notes: notes.trim(),
          userEmail: user?.email ?? '',
          tier: tier ?? 'standard',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Submission failed');
      }

      setSubmitState('success');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Something went wrong. Please try again.');
      setSubmitState('error');
    }
  }

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-fixed selection:text-primary min-h-screen">
      <Header />

      <main className="max-w-[1440px] mx-auto pt-24 pb-16 px-8">
        {/* Page heading */}
        <header className="mb-8">
          <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-1">Deal Analysis</h1>
          <p className="text-secondary mt-2 text-sm max-w-xl">
            Submit a property for a full deal analysis. Our team will review the
            parcel data, zoning, comps, and financing potential — then deliver a
            detailed report straight to your inbox.
          </p>
        </header>

        <div className="max-w-2xl">
          {submitState === 'success' ? (
            /* ── Success state ─────────────────────────────────── */
            <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <h2 className="font-headline text-2xl font-bold text-primary mb-2">
                Request Submitted!
              </h2>
              <p className="text-on-surface-variant text-sm max-w-sm mx-auto">
                Your report request has been submitted. You&apos;ll receive your
                analysis within{' '}
                <span className="font-semibold text-emerald-600">
                  {deliveryTime}
                </span>
                .
              </p>
              <button
                onClick={() => {
                  setAddress('');
                  setApn('');
                  setCounty('');
                  setState('');
                  setNotes('');
                  setSubmitState('idle');
                }}
                className="mt-6 px-5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm font-semibold text-secondary hover:text-on-surface transition-colors"
              >
                Submit Another
              </button>
            </div>
          ) : (
            /* ── Form ─────────────────────────────────────────── */
            <form
              onSubmit={handleSubmit}
              className="bg-surface-container rounded-2xl border border-outline-variant/20 p-8 space-y-5"
            >
              {/* Property Address */}
              <div>
                <label className={labelClass}>
                  Property Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 1234 Oak Hollow Rd"
                  className={inputClass}
                />
              </div>

              {/* APN */}
              <div>
                <label className={labelClass}>APN / Parcel Number</label>
                <input
                  type="text"
                  value={apn}
                  onChange={(e) => setApn(e.target.value)}
                  placeholder="e.g. 12-345-0067-000"
                  className={inputClass}
                />
              </div>

              {/* County + State row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>County</label>
                  <input
                    type="text"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    placeholder="e.g. El Paso"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select state…</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={labelClass}>
                  Additional Notes{' '}
                  <span className="text-secondary/50 normal-case font-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Any context that would help our team — intended use, financing questions, concerns, etc."
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Delivery time hint */}
              {!permLoading && (
                <p className="text-xs text-secondary">
                  ⏱ Your plan delivers reports within{' '}
                  <span className="font-semibold text-on-surface">
                    {deliveryTime}
                  </span>
                  .
                </p>
              )}

              {/* Error */}
              {submitState === 'error' && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3">
                  {errorMsg}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitState === 'loading'}
                className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {submitState === 'loading'
                  ? 'Submitting…'
                  : 'Submit for Analysis'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
