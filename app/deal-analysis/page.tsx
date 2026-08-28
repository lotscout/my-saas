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
          description="Submit a property for a 3–5 page deal analysis covering parcel data, zoning, comps, market demand, risks, financing potential, and next steps."
        />

        {showSampleReport && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center px-4 py-8">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setShowSampleReport(false)} />
            <div className="relative bg-white rounded-[1.75rem] shadow-2xl border border-outline-variant/20 max-w-4xl w-full max-h-[85vh] overflow-y-auto p-5 sm:p-8">
              <button
                type="button"
                onClick={() => setShowSampleReport(false)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-surface-container-low text-secondary hover:text-primary flex items-center justify-center"
                aria-label="Close sample report"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>

              <div className="pr-10 border-b border-outline-variant/15 pb-6">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1D9E75] mb-2">Sample Deal Analysis</p>
                <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">1234 Oak Hollow Rd, Austin, TX</h2>
                <p className="mt-2 text-sm text-secondary">Example 3–5 page report format. Final reports include property-specific data, public-record checks, local market context, deal risks, financing notes, and recommended next steps.</p>
              </div>

              <div className="mt-7 space-y-6">
                {[
                  {
                    page: 'Page 1',
                    title: 'Executive Summary',
                    items: [
                      ['Scout Take', 'Conditional yes. The property appears best suited for a small builder or infill investor if zoning, utilities, and access confirm cleanly.'],
                      ['Estimated Value Range', '$85K–$115K preliminary land value range based on nearby lot activity and improved-property exit potential.'],
                      ['Deal Fit', 'Strongest fit: single-family infill build, small builder hold, or resale after entitlement cleanup.'],
                      ['Primary Risks', 'Zoning interpretation, utility tap fees, setbacks, drainage, title exceptions, and overpaying against uncertain resale comps.'],
                    ],
                  },
                  {
                    page: 'Page 2',
                    title: 'Property Facts & Site Review',
                    items: [
                      ['Parcel Details', 'Address, APN, county, lot size, frontage, approximate dimensions, legal description, assessed value, ownership/entity records, and tax history.'],
                      ['Access & Utilities', 'Road access, curb cuts, electric/water/sewer proximity, septic/well considerations, easements, and utility extension risk.'],
                      ['Physical Constraints', 'Slope, floodplain, wetlands, drainage, tree coverage, buildable envelope, environmental red flags, and site-prep considerations.'],
                      ['Maps & Context', 'Aerial map, parcel boundary view, nearby development, school/retail access, and surrounding land-use pattern.'],
                    ],
                  },
                  {
                    page: 'Page 3',
                    title: 'Zoning, Market & Comps',
                    items: [
                      ['Zoning Check', 'Current zoning, allowed uses, density, setbacks, minimum lot size, parking, overlays, short-term rental limits if relevant, and entitlement path.'],
                      ['Comparable Sales', '3–6 recent land/improved-property comps with sale date, price, distance, lot size, price per acre or square foot, and adjustment notes.'],
                      ['Market Demand', 'Local buyer profile, days-on-market signals, builder activity, permit trend, nearby active inventory, and resale liquidity.'],
                      ['Pricing Read', 'Suggested offer range, stretch price, and walk-away number based on buyer strategy and expected exit.'],
                    ],
                  },
                  {
                    page: 'Page 4',
                    title: 'Deal Strategy, Financing & Next Steps',
                    items: [
                      ['Best Use Strategy', 'Recommended highest-probability path: build, hold, entitle, subdivide, seller finance, wholesale, or relist with improved positioning.'],
                      ['Financing Options', 'Cash/private capital, seller financing, land loan, construction loan, or partner capital, with likely lender concerns called out.'],
                      ['Due Diligence Checklist', 'Confirm zoning in writing, pull title, verify utilities, estimate site work, confirm access, check taxes/liens, and validate comps before submitting offer.'],
                      ['Action Plan', 'Next 7 days: county call, utility check, comp refresh, site visit, max-offer model, and seller/buyer outreach plan.'],
                    ],
                  },
                ].map(section => (
                  <section key={section.page} className="rounded-3xl border border-outline-variant/15 bg-white shadow-sm overflow-hidden">
                    <div className="bg-primary text-white px-5 py-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
                      <h3 className="font-headline text-xl font-extrabold">{section.title}</h3>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">{section.page} of 4</p>
                    </div>
                    <div className="p-5 grid gap-3">
                      {section.items.map(([title, body]) => (
                        <div key={title} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                          <h4 className="font-headline text-base font-extrabold text-primary mb-1">{title}</h4>
                          <p className="text-sm text-secondary leading-relaxed">{body}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                <div className="rounded-2xl bg-surface-container-low border border-outline-variant/20 p-4 text-xs text-secondary leading-relaxed">
                  LotScout reports are decision-support tools, not legal, appraisal, engineering, or tax opinions. Users should verify public records, zoning, title, utilities, and financial assumptions before purchasing, selling, lending, or developing land.
                </div>
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
