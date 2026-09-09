import Header from '@/components/Header';

const overviewStats = [
  { label: 'Acreage', value: '18.4 ac', icon: 'crop_square' },
  { label: 'Zoning', value: 'AG / RR', icon: 'home_work' },
  { label: 'Price / Acre', value: '$22,418', icon: 'payments' },
  { label: 'Parcel ID', value: 'R-29041', icon: 'tag' },
];

const comps = [
  { address: '5102 Hwy 21 E, Bastrop TX', acres: '22.1 ac', date: 'Feb 2026', total: '$498,000', ppa: '$22,534/ac', delta: '+0.5%' },
  { address: '308 Ridgemont Rd, Cedar Creek TX', acres: '15.6 ac', date: 'Nov 2025', total: '$336,500', ppa: '$21,571/ac', delta: '-3.8%' },
  { address: '9980 FM 812, Del Valle TX', acres: '20.0 ac', date: 'Sep 2025', total: '$450,000', ppa: '$22,500/ac', delta: '+0.4%' },
  { address: '1217 Still Forest Ln, Bastrop TX', acres: '17.8 ac', date: 'Jul 2025', total: '$397,000', ppa: '$22,303/ac', delta: '-0.5%' },
];

const zoningItems = [
  { label: 'Current Zoning', value: 'AG / Rural Residential', note: 'Allows single-family residential and agricultural use.' },
  { label: 'Permitted Use', value: 'Residential Subdivision', note: 'Subject to county platting, access, and utility requirements.' },
  { label: 'Min. Lot Size', value: '1.0 acre', note: 'Potential for approximately 16 developable lots after roads/open space.' },
  { label: 'Development Outlook', value: 'High Potential', note: 'Growth corridor with builder demand moving east from Austin.' },
];

const risks = [
  { label: 'Flood Risk', score: 92, verdict: 'Low', color: 'bg-emerald-500' },
  { label: 'Soil Quality', score: 84, verdict: 'Good', color: 'bg-emerald-400' },
  { label: 'Utility Access', score: 76, verdict: 'Moderate', color: 'bg-yellow-400' },
  { label: 'Road Frontage', score: 95, verdict: 'Excellent', color: 'bg-emerald-500' },
  { label: 'Title Clarity', score: 88, verdict: 'Clear', color: 'bg-emerald-400' },
];

const addedPages = [
  {
    title: 'Buyer Demand Snapshot',
    eyebrow: 'Page 2',
    body: 'Demand is strongest from small builders, Austin-area investors, and rural residential buyers seeking larger lots within 45–60 minutes of employment centers.',
    bullets: ['Most active buyer type: small builders and land investors', 'Likely hold period: 18–36 months', 'Best resale angle: entitled rural homesite package'],
  },
  {
    title: 'Infrastructure & Site Constraints',
    eyebrow: 'Page 4',
    body: 'Utilities are the main diligence item. Electric appears nearby, but water/sewer extension or septic feasibility should be confirmed before hard money goes non-refundable.',
    bullets: ['Confirm water provider and tap fees', 'Verify driveway/culvert requirements', 'Order preliminary title and easement review'],
  },
  {
    title: 'Offer Strategy',
    eyebrow: 'Page 6',
    body: 'The deal is attractive below $385K, acceptable around $400K if utilities confirm, and becomes thin above $425K without clearer entitlement upside.',
    bullets: ['Target offer: $365K–$385K', 'Stretch price: $405K', 'Walk-away: $425K unless seller carries paper'],
  },
];

export default function PropertyAnalysisSamplePage() {
  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <Header />

      <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-24 pb-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1D9E75] mb-2">Sample Property Analysis Report</p>
            <h1 className="font-headline text-3xl sm:text-5xl font-extrabold text-primary tracking-tight leading-tight">4721 County Road 218</h1>
            <p className="mt-2 text-secondary font-semibold">Bastrop County, TX 78602 · Example report format</p>
          </div>
          <a href="/property-analysis" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-outline-variant/20 px-4 py-2.5 text-sm font-extrabold text-primary hover:bg-emerald-50 transition-colors">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to analysis
          </a>
        </div>

        <section className="rounded-3xl border border-outline-variant/30 bg-white shadow-xl overflow-hidden">
          <div className="bg-primary px-6 sm:px-8 py-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">Page 1</p>
              <h2 className="font-headline text-2xl font-extrabold">Executive Property Overview</h2>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Est. Value</p>
              <p className="font-headline text-2xl font-extrabold">$412,500</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-outline-variant/20 p-6 shadow-sm">
                <p className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-1">Property Overview</p>
                <h3 className="font-headline text-xl font-extrabold text-primary leading-tight">18.4-acre rural residential parcel with subdivision potential</h3>
                <p className="mt-3 text-sm text-secondary leading-relaxed">This parcel presents a compelling acquisition opportunity for a buyer pursuing rural residential development or a medium-term hold-and-entitle strategy. Comparable sales support the current valuation range, while infrastructure diligence remains the key gating item.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 mt-5 border-t border-outline-variant/15">
                  {overviewStats.map(({ label, value, icon }) => (
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

              <div className="rounded-2xl border border-outline-variant/20 p-6 shadow-sm">
                <p className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-4">Comparable Sales — Last 12 Months</p>
                <div className="space-y-3">
                  {comps.map((comp, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-outline-variant/10 last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-sm text-primary">landscape</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface leading-tight truncate">{comp.address}</p>
                          <p className="text-xs text-secondary">{comp.acres} · Sold {comp.date}</p>
                        </div>
                      </div>
                      <div className="sm:text-right shrink-0">
                        <p className="text-sm font-extrabold text-on-surface">{comp.total}</p>
                        <p className="text-xs text-secondary">{comp.ppa} <span className={comp.delta.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}>{comp.delta}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 p-6 shadow-sm">
                <p className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-4">Zoning &amp; Development Potential</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {zoningItems.map(({ label, value, note }) => (
                    <div key={label} className="bg-surface-container-low rounded-xl p-4">
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-0.5">{label}</p>
                      <p className="text-sm font-extrabold text-primary">{value}</p>
                      <p className="text-xs text-secondary mt-1 leading-relaxed">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="bg-primary rounded-2xl p-6 text-white shadow-lg">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/60 mb-3">Analysis Score</p>
                <div className="flex items-end gap-2 mb-3">
                  <span className="font-headline text-6xl font-extrabold leading-none">94</span>
                  <span className="text-white/50 text-xl font-bold mb-1">/100</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                  <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '94%' }} />
                </div>
                <p className="text-sm text-white/70 leading-snug">Strong investment profile with above-market comps, low flood exposure, and high development demand.</p>
              </div>

              <div className="rounded-2xl border border-outline-variant/20 p-6 shadow-sm">
                <p className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-4">Risk Assessment</p>
                <div className="space-y-3">
                  {risks.map(({ label, score, verdict, color }) => (
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

              <div className="border border-outline-variant/20 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-sm text-black/60" style={{ fontVariationSettings: "'FILL' 1" }}>summarize</span>
                  <p className="text-[10px] font-extrabold text-black uppercase tracking-widest">Summary</p>
                </div>
                <p className="text-sm text-black leading-relaxed">Recommended for hold-and-develop strategy with a 3–5 year horizon, pending utility confirmation and county platting review.</p>
              </div>
            </aside>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {addedPages.map(page => (
            <section key={page.title} className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1D9E75] mb-2">{page.eyebrow}</p>
              <h3 className="font-headline text-xl font-extrabold text-primary mb-3">{page.title}</h3>
              <p className="text-sm text-secondary leading-relaxed mb-4">{page.body}</p>
              <ul className="space-y-2">
                {page.bullets.map(bullet => (
                  <li key={bullet} className="flex gap-2 text-sm text-on-surface">
                    <span className="material-symbols-outlined text-base text-[#1D9E75] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-3xl bg-primary text-white p-6 sm:p-8 shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60 mb-2">Page 7</p>
          <h3 className="font-headline text-2xl font-extrabold mb-3">Recommended Next Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['Confirm utilities and tap fees', 'Call county planning department', 'Refresh comps before offer', 'Submit LOI with diligence outs'].map(item => (
              <div key={item} className="rounded-2xl bg-white/10 border border-white/10 p-4 text-sm font-semibold leading-snug">{item}</div>
            ))}
          </div>
        </section>

        <p className="mt-6 rounded-2xl bg-white border border-outline-variant/20 p-4 text-xs text-secondary leading-relaxed">LotScout reports are decision-support tools, not legal, appraisal, engineering, or tax opinions. Users should verify public records, zoning, title, utilities, and financial assumptions before purchasing, selling, lending, or developing land.</p>
      </main>
    </div>
  );
}
