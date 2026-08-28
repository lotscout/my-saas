'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { PageHeader, SurfaceCard } from '@/components/ui/LotScoutUI';
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
  const [showSampleReport, setShowSampleReport] = useState(false);

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

      <main className="max-w-[1440px] mx-auto pt-24 pb-16 px-4 sm:px-8">
        <PageHeader
          title="Deal Analysis"
          description="Submit a property for a full deal analysis. Our team will review parcel data, zoning, comps, and financing potential."
        />

        {showSampleReport && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center px-4 py-8">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setShowSampleReport(false)} />
            <div className="relative bg-white rounded-[1.75rem] shadow-2xl border border-outline-variant/20 max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8">
              <button
                type="button"
                onClick={() => setShowSampleReport(false)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-surface-container-low text-secondary hover:text-primary flex items-center justify-center"
                aria-label="Close sample report"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>

              <div className="pr-10">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1D9E75] mb-2">Sample Deal Analysis</p>
                <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">Vacant Residential Lot Review</h2>
                <p className="mt-2 text-sm text-secondary">Example only. Final reports vary based on parcel data, local rules, comps, and requested scope.</p>
              </div>

              <div className="mt-7 grid gap-4">
                {[
                  ['Property Snapshot', '0.24-acre infill lot in a growing residential submarket with paved access, nearby utilities, and comparable residential development nearby.'],
                  ['Scout Take', 'Potentially attractive for a small builder if zoning confirms by-right residential use and utility tap costs are reasonable. Main risks are entitlement timing, setbacks, and finished-lot resale assumptions.'],
                  ['Valuation Range', 'Preliminary land value estimate: $85K–$115K based on nearby lot and improved-property comps. Verify with current MLS, county records, and recent off-market sales before offering.'],
                  ['Zoning / Use Check', 'Confirm allowed density, minimum lot size, setbacks, parking, access, and whether any overlays, floodplain, or special review requirements apply.'],
                  ['Financing Notes', 'Likely best fit for cash, private capital, seller financing, or a construction lender after plans and exit strategy are defined.'],
                  ['Recommended Next Steps', 'Verify zoning with the city/county, pull 3–5 recent comps, estimate utility/tap fees, confirm access/title, then set a max offer with a contingency buffer.'],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <h3 className="font-headline text-base font-extrabold text-primary mb-1">{title}</h3>
                    <p className="text-sm text-secondary leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <div className="mb-5 text-center">
            <button
              type="button"
              onClick={() => setShowSampleReport(true)}
              className="inline-flex items-center gap-2 text-sm font-extrabold text-[#1D9E75] hover:text-[#14795A] transition-colors"
            >
              <span className="material-symbols-outlined text-lg">description</span>
              View sample report
            </button>
          </div>
          {submitState === 'success' ? (
            /* ── Success state ─────────────────────────────────── */
            <SurfaceCard className="bg-surface-container p-8 text-center">
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
            </SurfaceCard>
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
                  placeholder="Any context that would help our team: intended use, financing questions, concerns, etc."
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
                className="w-full bg-[#1D9E75] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
