import Header from '@/components/Header';

const SELLERS = [
  { city: 'Portland, OR',       x: '9%',  y: '17%' },
  { city: 'San Francisco, CA',  x: '5%',  y: '42%' },
  { city: 'Salt Lake City, UT', x: '19%', y: '30%' },
  { city: 'Phoenix, AZ',        x: '16%', y: '58%' },
  { city: 'Denver, CO',         x: '27%', y: '36%' },
  { city: 'Dallas, TX',         x: '36%', y: '64%' },
  { city: 'Houston, TX',        x: '38%', y: '72%' },
  { city: 'Minneapolis, MN',    x: '50%', y: '15%' },
  { city: 'Kansas City, MO',    x: '47%', y: '40%' },
  { city: 'Nashville, TN',      x: '60%', y: '50%' },
  { city: 'Atlanta, GA',        x: '63%', y: '60%' },
  { city: 'New York, NY',       x: '80%', y: '27%' },
  { city: 'Boston, MA',         x: '83%', y: '20%' },
  { city: 'Raleigh, NC',        x: '71%', y: '48%' },
  { city: 'Boise, ID',          x: '14%', y: '20%' },
  { city: 'San Antonio, TX',    x: '33%', y: '72%' },
];

const BUYERS = [
  { city: 'Seattle, WA',        x: '7%',  y: '10%' },
  { city: 'Los Angeles, CA',    x: '8%',  y: '52%' },
  { city: 'Las Vegas, NV',      x: '14%', y: '44%' },
  { city: 'Albuquerque, NM',    x: '24%', y: '54%' },
  { city: 'Austin, TX',         x: '35%', y: '70%' },
  { city: 'Chicago, IL',        x: '58%', y: '26%' },
  { city: 'St. Louis, MO',      x: '54%', y: '42%' },
  { city: 'Memphis, TN',        x: '57%', y: '55%' },
  { city: 'Miami, FL',          x: '68%', y: '80%' },
  { city: 'Tampa, FL',          x: '65%', y: '74%' },
  { city: 'Philadelphia, PA',   x: '77%', y: '32%' },
  { city: 'Washington, DC',     x: '75%', y: '38%' },
  { city: 'Charlotte, NC',      x: '68%', y: '48%' },
  { city: 'Sacramento, CA',     x: '6%',  y: '35%' },
  { city: 'Columbus, OH',       x: '64%', y: '34%' },
  { city: 'Oklahoma City, OK',  x: '40%', y: '55%' },
];

export default function HomePage() {
  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-fixed selection:text-primary">
      <Header />

      {/* SECTION 1: Hero */}
      <header className="pt-24 pb-16 md:pt-32 md:pb-20 bg-primary-container relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-fixed-dim rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="max-w-4xl">
            <h1 className="font-headline text-6xl md:text-8xl font-extrabold text-white tracking-tight leading-[1.05] mb-6">
              Stop Waiting.<br />Start Closing.
            </h1>
            <p className="font-body text-xl md:text-2xl text-on-primary-container leading-relaxed mb-8 max-w-2xl">
              LotScout connects serious land buyers and sellers directly, without the MLS or commissions. Join today and save thousands on your next land deal.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <button className="bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface-container-low transition-colors shadow-lg">Find Your Next Deal</button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors">List Your Property</button>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-on-primary-container font-medium text-sm md:text-base border-t border-white/10 pt-6">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">verified</span> 92% of deals close within 25 days</span>
              <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container/30"></span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">payments</span> Zero Realtor Commission</span>
              <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container/30"></span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">groups</span> 2,400+ Active Buyers &amp; Sellers</span>
            </div>
          </div>
        </div>
      </header>

      {/* Off-market callout banner */}
      <div className="bg-emerald-900 py-4 px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <span className="material-symbols-outlined text-emerald-300 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
          <p className="text-white font-semibold text-lg">
            All listings on LotScout are off-market. Sell without a realtor and keep 100% of your proceeds.
          </p>
        </div>
      </div>

      {/* SECTION 2: The Problem */}
      <section className="py-16 bg-surface px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-4xl font-bold text-primary mb-8 tracking-tight">The Old Way Is Costing You</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Before LotScout */}
            <div className="bg-error-container/20 rounded-2xl p-6 md:p-8">
              <h3 className="font-headline text-2xl font-bold text-on-error-container mb-5">Before LotScout</h3>
              <ul className="space-y-3">
                {[
                  'Wait 6 to 12 months for traditional listings to gain traction',
                  'Lose up to 10% of equity to realtor commissions and fees',
                  'Manual data verification and title research create costly delays',
                  'Endless calls with unverified, tire-kicking buyers',
                  "Generic listing sites that don't understand land zoning",
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-error text-xl flex-none mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>close</span>
                    <span className="text-on-surface-variant font-medium text-base leading-snug">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* With LotScout */}
            <div className="bg-primary-fixed/20 rounded-2xl p-6 md:p-8 border border-primary/5">
              <h3 className="font-headline text-2xl font-bold text-primary mb-5">With LotScout</h3>
              <ul className="space-y-3">
                {[
                  'Average closing time reduced to under 30 days',
                  'Zero commission. Keep 100% of your property value',
                  'AI-powered zoning and topographic analysis reports',
                  'Instantly match with verified cash buyers and developers',
                  'Land-exclusive platform built for professionals',
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-xl flex-none mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-on-surface font-semibold text-base leading-snug">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Who It's For */}
      <section className="py-16 bg-surface-container-low px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="font-headline text-5xl font-bold text-primary tracking-tight mb-3">Built for Both Sides of the Deal</h2>
            <p className="text-secondary text-xl max-w-2xl">Whether you are liquidating an asset or expanding your portfolio, we provide the infrastructure to move faster.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-0 overflow-hidden rounded-3xl">
            {/* Seller */}
            <div className="bg-primary p-8 md:p-10 flex flex-col justify-between">
              <div>
                <div className="bg-on-primary-container/20 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-white text-2xl">sell</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-white mb-4">I&apos;m a Seller</h3>
                <p className="text-on-primary-container text-base mb-6">Reach a curated network of institutional and private buyers ready to deploy capital immediately.</p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Priority listing exposure',
                    'Direct-to-buyer messaging',
                    'Automated land valuation',
                    'Identity verification for buyers',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-white/90 font-medium">
                      <span className="material-symbols-outlined text-primary-fixed-dim">check</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <button className="w-full bg-primary-fixed text-primary py-4 rounded-xl font-bold text-lg hover:bg-white transition-colors">List My Property</button>
            </div>
            {/* Buyer */}
            <div className="bg-white p-8 md:p-10 flex flex-col justify-between">
              <div>
                <div className="bg-primary/5 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-2xl">search_insights</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-primary mb-4">I&apos;m a Buyer</h3>
                <p className="text-secondary text-base mb-6">Gain access to off-market inventory and deep-data insights before the general public sees the listing.</p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Off-market land opportunities',
                    'AI topographic assessments',
                    'Custom search alert criteria',
                    'Direct-to-seller negotiations',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-on-surface-variant font-medium">
                      <span className="material-symbols-outlined text-primary">check</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <button className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors">Find Land Now</button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: US Map */}
      <section className="py-16 bg-surface px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">

            {/* Left: headline, description, legend, stats */}
            <div>
              <h2 className="font-headline text-5xl font-bold text-primary tracking-tight mb-3">Where Buyers &amp; Sellers Are Active</h2>
              <p className="text-secondary text-xl mb-8">LotScout members are transacting land across the country every day.</p>

              {/* Legend */}
              <div className="flex items-center gap-8 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm ring-2 ring-emerald-200"></div>
                  <span className="text-sm font-semibold text-secondary">Sellers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-900 shadow-sm ring-2 ring-emerald-800/30"></div>
                  <span className="text-sm font-semibold text-secondary">Buyers</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6">
                <div className="bg-surface-container-low rounded-xl px-6 py-4 flex-1 text-center">
                  <div className="text-3xl font-extrabold text-emerald-600 mb-1">{SELLERS.length}</div>
                  <div className="text-xs font-bold text-secondary uppercase tracking-widest">Active Sellers</div>
                </div>
                <div className="bg-surface-container-low rounded-xl px-6 py-4 flex-1 text-center">
                  <div className="text-3xl font-extrabold text-emerald-900 mb-1">{BUYERS.length}</div>
                  <div className="text-xs font-bold text-secondary uppercase tracking-widest">Active Buyers</div>
                </div>
              </div>
            </div>

            {/* Right: interactive map */}
            <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-xl overflow-hidden">
              {/* Map header bar */}
              <div className="bg-surface-container-low px-4 py-2.5 flex items-center justify-between border-b border-outline-variant/15">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-secondary uppercase tracking-widest">Live Network</span>
                </div>
                <span className="text-xs text-secondary font-medium">Hover a dot to see location</span>
              </div>

              {/* Map container */}
              <div className="relative bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-50 overflow-hidden" style={{ paddingBottom: '62%' }}>
                {/* Grid lines */}
                <div
                  className="absolute inset-0 opacity-[0.07]"
                  style={{ backgroundImage: 'linear-gradient(#1B4332 1px, transparent 1px), linear-gradient(90deg, #1B4332 1px, transparent 1px)', backgroundSize: '60px 60px' }}
                />
                <div className="absolute inset-4 rounded-xl bg-emerald-50/40 border border-emerald-100/60" />

                {/* Seller dots */}
                {SELLERS.map((dot) => (
                  <div
                    key={dot.city}
                    className="absolute group"
                    style={{ left: dot.x, top: dot.y, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md ring-2 ring-white cursor-pointer hover:scale-150 transition-transform" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                      <div className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-lg">
                        {dot.city}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Buyer dots */}
                {BUYERS.map((dot) => (
                  <div
                    key={dot.city}
                    className="absolute group"
                    style={{ left: dot.x, top: dot.y, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-900 shadow-md ring-2 ring-white cursor-pointer hover:scale-150 transition-transform" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                      <div className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-lg">
                        {dot.city}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Map footer */}
              <div className="bg-surface-container-low px-4 py-2 border-t border-outline-variant/15 text-xs text-secondary font-medium">
                Continental US shown · Updated daily
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5: Social Proof Stats */}
      <section className="py-16 bg-primary text-white px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { stat: '92%',    label: 'Fast Closing Rate' },
            { stat: '0%',     label: 'Commission Paid' },
            { stat: '3x',     label: 'Deal Efficiency' },
            { stat: '2,400+', label: 'Active Listings' },
          ].map(({ stat, label }) => (
            <div key={label} className="text-center p-6 bg-white/5 rounded-2xl">
              <div className="text-4xl md:text-5xl font-extrabold mb-1 text-primary-fixed">{stat}</div>
              <div className="text-on-primary-container font-medium uppercase tracking-widest text-xs">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: Marketplace Preview */}
      <section className="py-16 bg-surface px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <h2 className="font-headline text-5xl font-bold text-primary tracking-tight">A Glimpse of What&apos;s Inside</h2>
            <span className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold px-4 py-2 rounded-full flex-shrink-0">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              All properties are off-market listings
            </span>
          </div>
          <p className="text-secondary text-xl mb-12">All properties on LotScout are off-market listings you won&apos;t find on Zillow or Realtor.com.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col h-full border border-surface-container-high">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-full h-48 object-cover" alt="aerial landscape of a vast green rolling hill pasture during sunset" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZulao6-fdPwv2dF4rCmpLxldDqaxwyGM1jAI60S0PXAiHvKusydmS7WFNrGZnWz3agwBLEApnoku9sp4EhNNceAoxGd5ZAXvNqqIxw-XJ0nhfC3zdwh_V9x6pN9qZWr0BfWBjulUvndtIDYgvMZa37uL5q7oOrlugcGuGU5t2sqHuoYcX-JGE7QGNvU1zStdrQrsrxV8hg5RdvZbdYEDWLxsiJu8QEujvbw5qsxRUfLnHmarvBynQs-vYnKjlgYG4a8Kb38v0LWdV" />
              <div className="p-6">
                <div className="text-primary font-bold text-xl mb-1">$450,000</div>
                <div className="text-secondary font-medium mb-4">65 Acres · Gallatin, MT</div>
                <div className="flex gap-2">
                  <span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase">Residential</span>
                  <span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase">Riverfront</span>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col h-full border border-surface-container-high">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-full h-48 object-cover" alt="dramatic mountain peaks with pine forest in foreground under a clear blue alpine sky" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzc__lHoSAdcSO8AzlHGngmhLFyyJKdxCymOUePJ02ntLt232Z_VO7rydLpCKr3Ezbptxnz_wcY32esEgXuSDNnaiSAX3VdMQD4sWtRChsyBqACGwQ1LGvOerOjXc1NmpIpODR8q8Y-gZ-MvvQTk8J6iv3Jao-5TCJcKCA_Um0U2P2p3a-cQnxGZSqnLj3iKD779Sa4Zo4BagWKtSNbNoiEaB8DlChHVCmUFeYuYH9m6d9RgcqCTaCv1vqLNh59sO0yOfhmKsw8abG" />
              <div className="p-6">
                <div className="text-primary font-bold text-xl mb-1">$1,200,000</div>
                <div className="text-secondary font-medium mb-4">210 Acres · Bend, OR</div>
                <div className="flex gap-2">
                  <span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase">Timber</span>
                  <span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase">Off-Grid</span>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col h-full border border-surface-container-high">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-full h-48 object-cover" alt="wide open flat ranch land with golden grass and scattered oak trees" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBY8GRIcD8bfludLFbbSK2-UO4kPxRWkltV05YcwfOfumwBuFit8qogzpUo5R7jRl3nmg2D5nktA3OIz3-o0AD1PgdOydScI-4fGpEyeyJ8LYrP6vidGCO93e4R6bVb7kradtCFRd6aNDuWKsDYyBUafliElyzavFiss21NsffAFE3tqx0X2aCa0odAjaGbQmYyLaJoTDI0gkNAyHs-hXwnliG7GDBEVW1lLcX-A1eyBkIXamMLLI2KKL4PQIsp_-ovx_kWI1K7N--F" />
              <div className="p-6">
                <div className="text-primary font-bold text-xl mb-1">$725,000</div>
                <div className="text-secondary font-medium mb-4">120 Acres · Boerne, TX</div>
                <div className="flex gap-2">
                  <span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase">Ranch</span>
                  <span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase">Fenced</span>
                </div>
              </div>
            </div>
            {/* Card 4 - locked */}
            <div className="relative bg-white rounded-xl overflow-hidden shadow-sm flex flex-col h-full border border-surface-container-high group">
              <div
                className="blur-md grayscale opacity-50 h-full w-full absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuASYXdtkI0pKaN4KHtgDbkNT4ZERJxlztUPHz5d65poQKRw0NjABePxTimTG-cz6LtOqkMXF-zzzwIaFrDkQEjT3wpbPzQAqNdK5QDMK4hIsz_ZWIscZ2C7HZTU7c1-2DhI6xurbxtghY2ob8gvCuxAhZZZ2lemxdpTf1InVz8Rz76JP84Ayuq3weQvP6_7e0sJ9nDVSvGnoVQ3PAqqL2s7GgUfZB-FvUUUdqnKBEgBI0WRlQrkzy6L_Q7MnR6kre3Ba0NqtSvnD08l')" }}
              />
              <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full text-center bg-white/20 backdrop-blur-[2px]">
                <span className="material-symbols-outlined text-primary text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                <p className="font-headline font-bold text-primary mb-6">Sign up to unlock 2,400+ off-market listings</p>
                <button className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform">Get Started</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: New Buyers Added Daily */}
      <section className="py-16 bg-surface-container-low px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-5xl font-bold text-primary tracking-tight mb-3">New Buyers Added Daily</h2>
          <p className="text-secondary text-xl mb-10 max-w-2xl">
            Sellers — these buyers are actively searching for land like yours right now.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Buyer Card 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-surface-container-high flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-none">
                  <span className="material-symbols-outlined text-primary text-2xl">corporate_fare</span>
                </div>
                <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> Verified
                </span>
              </div>
              <h3 className="font-headline font-extrabold text-primary text-xl leading-tight mb-0.5">Vanguard Land Trust</h3>
              <p className="text-secondary text-base font-medium mb-4">Denver, CO</p>
              <div className="space-y-2 text-base flex-grow">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">crop_square</span>
                  <span>50 to 500 acres</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">payments</span>
                  <span>$500k to $2M budget</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">nature</span>
                  <span>Agricultural / Conservation</span>
                </div>
              </div>
              <button className="mt-5 w-full py-2.5 rounded-xl border border-primary/20 text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all">View Profile</button>
            </div>

            {/* Buyer Card 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-surface-container-high flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-none">
                  <span className="material-symbols-outlined text-primary text-2xl">construction</span>
                </div>
                <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> Verified
                </span>
              </div>
              <h3 className="font-headline font-extrabold text-primary text-xl leading-tight mb-0.5">BuildWorks Inc.</h3>
              <p className="text-secondary text-base font-medium mb-4">Austin, TX</p>
              <div className="space-y-2 text-base flex-grow">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">crop_square</span>
                  <span>5 to 20 acres</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">payments</span>
                  <span>$200k to $800k budget</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">home_work</span>
                  <span>Light Industrial / Residential</span>
                </div>
              </div>
              <button className="mt-5 w-full py-2.5 rounded-xl border border-primary/20 text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all">View Profile</button>
            </div>

            {/* Buyer Card 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-surface-container-high flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-none">
                  <span className="material-symbols-outlined text-primary text-2xl">forest</span>
                </div>
                <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> Verified
                </span>
              </div>
              <h3 className="font-headline font-extrabold text-primary text-xl leading-tight mb-0.5">Meridian Land Holdings</h3>
              <p className="text-secondary text-base font-medium mb-4">Seattle, WA</p>
              <div className="space-y-2 text-base flex-grow">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">crop_square</span>
                  <span>100 to 1,000 acres</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">payments</span>
                  <span>$1M to $5M budget</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary/50">park</span>
                  <span>Timberland / Recreational</span>
                </div>
              </div>
              <button className="mt-5 w-full py-2.5 rounded-xl border border-primary/20 text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all">View Profile</button>
            </div>

            {/* Card 4 - locked */}
            <div className="relative bg-white rounded-xl overflow-hidden shadow-sm flex flex-col h-full border border-surface-container-high">
              <div className="blur-sm opacity-40 absolute inset-0 p-6 space-y-4 pointer-events-none">
                <div className="w-12 h-12 bg-primary/10 rounded-full"></div>
                <div className="h-4 bg-surface-container-high rounded w-3/4"></div>
                <div className="h-3 bg-surface-container-high rounded w-1/2"></div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-surface-container-high rounded w-full"></div>
                  <div className="h-3 bg-surface-container-high rounded w-5/6"></div>
                  <div className="h-3 bg-surface-container-high rounded w-4/5"></div>
                </div>
              </div>
              <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full text-center min-h-[280px]">
                <span className="material-symbols-outlined text-primary text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                <p className="font-headline font-bold text-primary mb-6 leading-snug">Sign up to see all active buyers</p>
                <button className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform">Get Started</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: Pricing Teaser */}
      <section className="py-16 bg-surface px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-5xl font-bold text-primary mb-10 text-center tracking-tight">Simple, Transparent Pricing. No Hidden Fees.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Standard */}
            <div className="bg-white p-8 rounded-2xl flex flex-col shadow-sm border border-surface-container-high">
              <h3 className="font-headline text-2xl font-bold text-primary mb-2">Standard</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-primary">$97</span>
                <span className="text-secondary">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {[
                  'Land Marketplace Access',
                  'Lot to Buyer Match AI',
                  'Custom Company Profile',
                  'Buyer Directory Access',
                  'Property Analysis Reports (24hr delivery)',
                  'Lot Analysis Reports (24hr delivery)',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-on-surface-variant text-base">
                    <span className="material-symbols-outlined text-primary text-lg flex-none mt-0.5">check</span> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-4 rounded-xl border-2 border-primary-fixed text-primary font-bold hover:bg-primary-fixed/10 transition-colors">Get Started</button>
            </div>
            {/* Priority */}
            <div className="bg-white p-8 rounded-2xl flex flex-col shadow-xl border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Most Popular</div>
              <h3 className="font-headline text-2xl font-bold text-primary mb-2">Priority</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-primary">$329</span>
                <span className="text-secondary">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {[
                  'Everything in Standard',
                  'Unlimited Listings',
                  'Promoted Lot Requests',
                  'Financing Partners Access',
                  '24/7 Support',
                  'Property Analysis Reports (15 min delivery)',
                  'Lot Analysis Reports (15 min delivery)',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-on-surface font-semibold text-base">
                    <span className="material-symbols-outlined text-primary text-lg flex-none mt-0.5">check</span> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-4 rounded-xl bg-primary text-white font-bold hover:shadow-lg transition-all">Get Started</button>
            </div>
            {/* Exclusive */}
            <div className="bg-white p-8 rounded-2xl flex flex-col shadow-sm border border-surface-container-high">
              <h3 className="font-headline text-2xl font-bold text-primary mb-2">Exclusive</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold text-primary">$799</span>
                <span className="text-secondary">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {[
                  'Everything in Priority',
                  'Hands-On Listing Support',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-on-surface-variant text-base">
                    <span className="material-symbols-outlined text-primary text-lg flex-none mt-0.5">check</span> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-4 rounded-xl border-2 border-primary-fixed text-primary font-bold hover:bg-primary-fixed/10 transition-colors">Get Started</button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: Final CTA */}
      <section className="py-16 bg-primary px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="font-headline text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">Your Next Land Partnership Starts Here</h2>
          <p className="text-on-primary-container text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed">
            LotScout connects serious buyers and sellers of off-market land directly. No realtors. No commission. No waiting on the MLS. Just the right match at the right time.
          </p>
          <button className="bg-white text-primary px-10 py-5 rounded-xl font-bold text-xl shadow-2xl hover:bg-surface-container-low transition-colors active:scale-95 transition-transform">Get Started Free</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-950 w-full py-12 px-8">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-8 font-body text-sm tracking-normal">
          <div className="text-xl font-bold text-emerald-50">LotScout</div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="#">Terms of Service</a>
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="#">Privacy Policy</a>
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="#">Cookie Settings</a>
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="#">Contact Sales</a>
            <a className="text-emerald-300/70 hover:text-white transition-colors" href="#">Data Sources</a>
          </div>
          <div className="text-emerald-300/70">© 2026 LotScout Technologies. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
