'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useSubscription } from '@/hooks/useSubscription';

export default function PropertyAnalysisPage() {
  const { tier, loading } = useSubscription();
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const isFree = !loading && !tier;
  const showInputGate = isFree && inputFocused && !overlayDismissed;
  const showSpeedBanner = !loading && tier === 'standard';

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-fixed selection:text-primary">
      <Header />

      <main className="max-w-[1440px] mx-auto pt-24 pb-16 px-8">

        {/* Page heading */}
        <header className="mb-6">
          <p className="text-secondary font-medium tracking-wide uppercase text-xs mb-1">Tools</p>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight">
            Deal <span className="text-emerald-600">Analysis</span>
          </h1>
        </header>

        {/* Search bar */}
        <div className="w-full max-w-3xl mb-4">
          <div className="relative">
            <div className="bg-surface-container-low p-2 rounded-full border border-outline-variant/30 shadow-sm flex items-center gap-2">
              <div className="flex-1 flex items-center px-6">
                <span className="material-symbols-outlined text-primary mr-3">location_on</span>
                <input
                  className="w-full bg-transparent border-none text-on-surface placeholder-secondary/50 focus:ring-0 text-lg py-4 font-body"
                  placeholder="Enter property address or parcel ID to begin..."
                  type="text"
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  readOnly={isFree}
                />
              </div>
              <a
                className="bg-primary text-on-primary font-bold px-8 py-4 rounded-full transition-all flex items-center gap-2 group shadow-lg hover:opacity-95 active:scale-95"
                href="#"
              >
                Analyze Property
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">analytics</span>
              </a>
            </div>

            {/* Free-tier inline gate overlay */}
            {showInputGate && (
              <div className="absolute inset-0 z-10 flex items-center justify-between gap-4 bg-surface-container-low/95 backdrop-blur-sm rounded-full border border-primary/20 px-8 shadow-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  <p className="text-sm font-semibold text-on-surface leading-tight truncate">
                    Unlock Deal Analysis — create a paid account to run analysis on any property
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <a
                    href="/pricing"
                    className="bg-primary text-on-primary font-bold text-xs px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                    View Plans →
                  </a>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); setOverlayDismissed(true); }}
                    className="text-secondary text-xs hover:text-on-surface transition-colors whitespace-nowrap"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-6 text-secondary text-sm">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">check_circle</span> 150M+ Parcels</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">check_circle</span> Real-time Comps</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">check_circle</span> AI-Risk Scoring</span>
          </div>
        </div>

        {/* Two-column layout: how it works (left 40%) + sample report (right 60%) */}
        <div className="mt-16 flex flex-col lg:flex-row gap-20 items-start">

          {/* ── Left: How it works (40%) ── */}
          <div className="w-full lg:w-[40%] lg:sticky lg:top-28">
            <h2 className="font-headline text-3xl font-extrabold text-primary tracking-tight mb-2">How it works</h2>
            <p className="text-secondary text-sm leading-relaxed mb-8">
              LotScout uses advanced data and mapping technology to quickly analyze land, so you can confidently make smarter buying and selling decisions.
            </p>
            <div className="space-y-4">
              {[
                { icon: 'input',        step: '01', title: 'Input Property',              body: 'Search by address, parcel ID, or simply drop a pin on our high-resolution topographic map interface.' },
                { icon: 'auto_awesome', step: '02', title: 'AI-Powered Comparison',       body: 'Our engine instantly scans thousands of recent transactions and environmental data points to calculate true market value.' },
                { icon: 'description',  step: '03', title: 'Export Comprehensive Report', body: 'Download a detailed PDF report containing zoning insights, risk assessments, and comparable property maps.' },
              ].map(({ icon, step, title, body }) => (
                <div key={step} className="flex gap-5 bg-surface-container-low p-6 rounded-xl border-l-4 border-primary/20 hover:border-primary/50 hover:bg-surface-container transition-all">
                  <div className="flex-none w-12 h-12 bg-primary text-on-primary rounded-lg flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-0.5">Step {step}</p>
                    <h3 className="font-headline text-base font-bold text-primary mb-1">{title}</h3>
                    <p className="text-secondary leading-relaxed text-sm">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="hidden lg:block w-px self-stretch bg-outline-variant/30" />

          {/* ── Right: Sample Report Mockup (60%) — always visible ── */}
          <div className="w-full lg:w-[60%]">
            <div className="rounded-2xl border border-outline-variant/30 overflow-hidden shadow-xl">

              {/* Report header bar */}
              <div className="bg-primary px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-white/70">description</span>
                  <span className="text-white font-headline font-bold tracking-tight">Sample Analysis Report</span>
                  <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-emerald-400/30">Preview</span>
                </div>
                <span className="text-white/50 text-xs">Generated Apr 12, 2026 • LotScout AI</span>
              </div>

              <div className="bg-surface-container-lowest p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left column */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Property overview */}
                  <div className="bg-white rounded-xl border border-outline-variant/20 p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-1">Property Overview</p>
                        <h2 className="font-headline text-xl font-extrabold text-primary leading-tight">4721 County Road 218<br/><span className="font-medium text-secondary text-base">Bastrop County, TX 78602</span></h2>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-right">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Est. Value</p>
                        <p className="font-headline text-lg font-extrabold text-primary">$412,500</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-outline-variant/15">
                      {[
                        { label: 'Acreage', value: '18.4 ac', icon: 'crop_square' },
                        { label: 'Zoning', value: 'AG / RR', icon: 'home_work' },
                        { label: 'Price / Acre', value: '$22,418', icon: 'payments' },
                        { label: 'Parcel ID', value: 'R-29041', icon: 'tag' },
                      ].map(({ label, value, icon }) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-primary/40">{icon}</span>
                          <div>
                            <p className="text-[10px] text-secondary uppercase tracking-wider font-bold">{label}</p>
                            <p className="text-sm font-bold text-on-surface">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comparable sales */}
                  <div className="bg-white rounded-xl border border-outline-variant/20 p-6 shadow-sm">
                    <p className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-4">Comparable Sales — Last 12 Months</p>
                    <div className="space-y-3">
                      {[
                        { address: '5102 Hwy 21 E, Bastrop TX',      acres: '22.1 ac', date: 'Feb 2026', total: '$498,000', ppa: '$22,534/ac', delta: '+0.5%' },
                        { address: '308 Ridgemont Rd, Cedar Creek TX', acres: '15.6 ac', date: 'Nov 2025', total: '$336,500', ppa: '$21,571/ac', delta: '-3.8%' },
                        { address: '9980 FM 812, Del Valle TX',        acres: '20.0 ac', date: 'Sep 2025', total: '$450,000', ppa: '$22,500/ac', delta: '+0.4%' },
                      ].map((comp, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                              <span className="material-symbols-outlined text-sm text-primary">landscape</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-on-surface leading-tight">{comp.address}</p>
                              <p className="text-xs text-secondary">{comp.acres} · Sold {comp.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-extrabold text-on-surface">{comp.total}</p>
                            <p className="text-xs text-secondary">{comp.ppa} <span className={comp.delta.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}>{comp.delta}</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Zoning & development potential */}
                  <div className="bg-white rounded-xl border border-outline-variant/20 p-6 shadow-sm">
                    <p className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-4">Zoning &amp; Development Potential</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Current Zoning',        value: 'AG / Rural Residential',       note: 'Allows single-family, agricultural use' },
                        { label: 'Permitted Use',          value: 'Residential Subdivision',      note: 'Subject to county platting requirements' },
                        { label: 'Min. Lot Size',          value: '1.0 acre',                     note: 'Max ~16 developable lots' },
                        { label: 'Development Outlook',    value: 'High Potential',               note: 'Growth corridor — demand accelerating' },
                      ].map(({ label, value, note }) => (
                        <div key={label} className="bg-surface-container-low rounded-lg p-3">
                          <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-0.5">{label}</p>
                          <p className="text-sm font-extrabold text-primary">{value}</p>
                          <p className="text-xs text-secondary mt-0.5">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right column */}
                <div className="space-y-6">

                  {/* Analysis score */}
                  <div className="bg-primary rounded-xl p-6 text-white shadow-lg">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/60 mb-3">Analysis Score</p>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="font-headline text-6xl font-extrabold leading-none">94</span>
                      <span className="text-white/50 text-xl font-bold mb-1">/100</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                      <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '94%' }} />
                    </div>
                    <p className="text-sm text-white/70 leading-snug">Strong investment profile. Above-market comps, low flood exposure, and high development demand in the corridor.</p>
                  </div>

                  {/* Risk assessment */}
                  <div className="bg-white rounded-xl border border-outline-variant/20 p-6 shadow-sm">
                    <p className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-4">Risk Assessment</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Flood Risk',       score: 92, verdict: 'Low',       color: 'bg-emerald-500' },
                        { label: 'Soil Quality',     score: 84, verdict: 'Good',      color: 'bg-emerald-400' },
                        { label: 'Utility Access',   score: 76, verdict: 'Moderate',  color: 'bg-yellow-400' },
                        { label: 'Road Frontage',    score: 95, verdict: 'Excellent', color: 'bg-emerald-500' },
                        { label: 'Title Clarity',    score: 88, verdict: 'Clear',     color: 'bg-emerald-400' },
                      ].map(({ label, score, verdict, color }) => (
                        <div key={label}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-on-surface">{label}</span>
                            <span className="text-xs font-extrabold text-primary">{verdict}</span>
                          </div>
                          <div className="w-full bg-surface-container-high rounded-full h-1.5">
                            <div className={`${color} h-1.5 rounded-full`} style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI summary */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-sm text-emerald-700" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest">AI Summary</p>
                    </div>
                    <p className="text-sm text-emerald-900 leading-relaxed">
                      This 18.4-acre parcel in Bastrop County presents a compelling acquisition opportunity. Comparable sales indicate stable appreciation of ~2% annually, and the property sits outside the 100-year flood plain. Utility infrastructure is within 0.4 miles. Recommended for hold-and-develop strategy with a 3–5 year horizon.
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* Standard-tier speed upgrade banner */}
            {showSpeedBanner && (
              <div className="mt-4 flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4">
                <span className="text-amber-500 text-2xl shrink-0">⚡</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-900 text-sm">Want faster results?</p>
                  <p className="text-amber-700 text-xs mt-0.5">Upgrade your account to receive your deal analysis within 15 minutes.</p>
                </div>
                <a
                  href="/pricing"
                  className="shrink-0 bg-amber-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-amber-600 transition-colors whitespace-nowrap"
                >
                  Upgrade →
                </a>
              </div>
            )}
          </div>

        </div>

      </main>

      <footer className="bg-primary text-on-primary w-full py-12 mt-16">
        <div className="max-w-screen-2xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-lg font-bold text-white font-headline">LotScout</span>
            <p className="font-['Inter'] text-xs tracking-wide uppercase text-white/60">© 2026 LotScout. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-4 justify-start md:justify-end">
            <a className="text-white/60 hover:text-white transition-opacity text-xs uppercase tracking-wide font-body" href="#">Terms of Service</a>
            <a className="text-white/60 hover:text-white transition-opacity text-xs uppercase tracking-wide font-body" href="#">Privacy Policy</a>
            <a className="text-white/60 hover:text-white transition-opacity text-xs uppercase tracking-wide font-body" href="#">Data Sources</a>
            <a className="text-white/60 hover:text-white transition-opacity text-xs uppercase tracking-wide font-body" href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
