import Header from '@/components/Header';

export default function HomePage() {
  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-fixed selection:text-primary">
      <Header />

      {/* SECTION 1: Hero */}
      <header className="pt-32 pb-24 md:pt-48 md:pb-32 bg-primary-container relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-fixed-dim rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="max-w-4xl">
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-8">
              Stop Waiting.<br />Start Closing.
            </h1>
            <p className="font-body text-lg md:text-xl text-on-primary-container leading-relaxed mb-12 max-w-2xl">
              LotScout connects serious land buyers and sellers directly — no realtors, no commissions, no wasted months. Just verified deals, AI-powered analysis, and a matched network built for land professionals.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <button className="bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface-container-low transition-colors shadow-lg">Find Your Next Deal</button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors">List Your Property</button>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-on-primary-container font-medium text-sm md:text-base border-t border-white/10 pt-8">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">verified</span> 92% of deals close within 25 days</span>
              <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container/30"></span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">payments</span> Zero Realtor Commission</span>
              <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container/30"></span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">groups</span> 2,400+ Active Buyers &amp; Sellers</span>
            </div>
          </div>
        </div>
      </header>

      {/* SECTION 2: The Problem */}
      <section className="py-24 bg-surface px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-4xl font-bold text-primary mb-16 tracking-tight">The Old Way Is Costing You</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Old Way */}
            <div className="bg-error-container/20 rounded-2xl p-8 md:p-12">
              <h3 className="font-headline text-2xl font-bold text-on-error-container mb-8">Selling on Your Own or With a Realtor</h3>
              <ul className="space-y-6">
                {[
                  'Wait 6-12 months for traditional listings to gain traction',
                  'Lose up to 10% of equity to realtor commissions & fees',
                  'Manual data verification and title research bottlenecks',
                  'Endless calls with unverified, tire-kicking "buyers"',
                  "Generic listing sites that don't understand land zoning",
                ].map((text) => (
                  <li key={text} className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-error font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>close</span>
                    <span className="text-on-surface-variant font-medium">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* LotScout Way */}
            <div className="bg-primary-fixed/20 rounded-2xl p-8 md:p-12 border border-primary/5">
              <h3 className="font-headline text-2xl font-bold text-primary mb-8">With LotScout</h3>
              <ul className="space-y-6">
                {[
                  'Average closing time reduced to under 30 days',
                  'Zero Commission—keep 100% of your property\'s value',
                  'AI-powered zoning and topographic analysis reports',
                  'Instantly match with verified cash buyers & developers',
                  'Land-exclusive platform built for professionals',
                ].map((text) => (
                  <li key={text} className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-on-surface font-semibold">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Who It's For */}
      <section className="py-24 bg-surface-container-low px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="font-headline text-4xl font-bold text-primary tracking-tight mb-4">Built for Both Sides of the Deal</h2>
            <p className="text-secondary text-lg max-w-2xl">Whether you are liquidating an asset or expanding your portfolio, we provide the infrastructure to move faster.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-0 overflow-hidden rounded-3xl">
            {/* Seller */}
            <div className="bg-primary p-12 md:p-16 flex flex-col justify-between">
              <div>
                <div className="bg-on-primary-container/20 w-16 h-16 rounded-full flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-white text-3xl">sell</span>
                </div>
                <h3 className="font-headline text-3xl font-bold text-white mb-6">I&apos;m a Seller</h3>
                <p className="text-on-primary-container text-lg mb-8">Reach a curated network of institutional and private buyers ready to deploy capital immediately.</p>
                <ul className="space-y-4 mb-12">
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
            <div className="bg-white p-12 md:p-16 flex flex-col justify-between">
              <div>
                <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-primary text-3xl">search_insights</span>
                </div>
                <h3 className="font-headline text-3xl font-bold text-primary mb-6">I&apos;m a Buyer</h3>
                <p className="text-secondary text-lg mb-8">Gain access to off-market inventory and deep-data insights before the general public sees the listing.</p>
                <ul className="space-y-4 mb-12">
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

      {/* SECTION 4: Live Activity Feed */}
      <section className="py-24 bg-surface px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <h2 className="font-headline text-3xl font-bold text-primary tracking-tight">Deals Happening Right Now</h2>
              <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span> Live
              </span>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-8 px-8">
            {[
              { tag: 'MATCH',       time: '2 mins ago',   body: 'Institutional Buyer matched with 420-Acre Timberland in Oregon.',        stat: '$1,240,000 Deal' },
              { tag: 'NEW LISTING', time: '14 mins ago',  body: 'Prime Development Lot listed in Austin, TX suburbs.',                     stat: '12.5 Acres · $850k' },
              { tag: 'ANALYSIS',    time: '32 mins ago',  body: 'Topographic & Zoning AI Report completed for parcel #4492.',              stat: '99.8% Accuracy Score' },
              { tag: 'CLOSED',      time: '1 hour ago',   body: 'Transaction finalized: "The Ranch at Cedar Creek".',                      stat: '$3,400,000 · 18 Days' },
              { tag: 'MATCH',       time: '2 hours ago',  body: 'Solar Developer matched with Arizona Desert Flatland.',                   stat: '850 Acres · Off-Market' },
            ].map((card, i) => (
              <div key={i} className="flex-none w-80 bg-white p-6 rounded-xl border-l-4 border-emerald-500 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-secondary tracking-widest uppercase">{card.tag}</span>
                  <span className="text-xs text-slate-400">{card.time}</span>
                </div>
                <p className="text-on-surface font-medium mb-3">{card.body}</p>
                <div className="text-primary font-bold">{card.stat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: How It Works */}
      <section className="py-24 bg-surface-container-low px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-4xl font-bold text-primary mb-20 text-center tracking-tight">How LotScout Works</h2>
          <div className="grid md:grid-cols-3 gap-12 relative">
            {[
              { num: '1', icon: 'account_circle', title: 'Create Your Profile',    body: 'Verified professionals only. Tell us if you are selling inventory or hunting for specific acquisitions.' },
              { num: '2', icon: 'hub',            title: 'Get Matched Instantly',  body: 'Our AI engine pairs inventory with demand in real-time, notifying both parties of a compatible deal.' },
              { num: '3', icon: 'handshake',      title: 'Close the Deal',         body: 'Communicate directly, review analysis reports, and move to escrow without expensive intermediaries.' },
            ].map(({ num, icon, title, body }) => (
              <div key={num} className="relative z-10 text-center">
                <div className="w-20 h-20 bg-primary-container text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl font-headline text-2xl font-bold">{num}</div>
                <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-primary text-3xl">{icon}</span>
                </div>
                <h3 className="font-headline text-xl font-bold text-primary mb-4">{title}</h3>
                <p className="text-secondary leading-relaxed">{body}</p>
              </div>
            ))}
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-0.5 bg-primary/10 -z-0"></div>
          </div>
        </div>
      </section>

      {/* SECTION 6: Social Proof Stats */}
      <section className="py-24 bg-primary text-white px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { stat: '92%',   label: 'Fast Closing Rate' },
            { stat: '0%',    label: 'Commision Paid' },
            { stat: '3x',    label: 'Deal Efficiency' },
            { stat: '2,400+', label: 'Active Listings' },
          ].map(({ stat, label }) => (
            <div key={label} className="text-center p-8 bg-white/5 rounded-2xl">
              <div className="text-4xl md:text-5xl font-extrabold mb-2 text-primary-fixed">{stat}</div>
              <div className="text-on-primary-container font-medium uppercase tracking-widest text-xs">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 7: Marketplace Preview */}
      <section className="py-24 bg-surface px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-4xl font-bold text-primary mb-12 tracking-tight">A Glimpse of What&apos;s Inside</h2>
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
            {/* Card 4 — locked/blurred */}
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

      {/* SECTION 8: Pricing Teaser */}
      <section className="py-24 bg-surface-container-low px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-4xl font-bold text-primary mb-16 text-center tracking-tight">Simple, Transparent Pricing — No Hidden Fees</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Standard */}
            <div className="bg-white p-10 rounded-2xl flex flex-col shadow-sm">
              <h3 className="font-headline text-xl font-bold text-primary mb-2">Standard</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-primary">$97</span>
                <span className="text-secondary">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {['Browse Public Marketplace', '3 Land Listings per Month', 'Basic Property Data', 'Direct Messaging'].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-on-surface-variant text-sm">
                    <span className="material-symbols-outlined text-primary text-lg">check</span> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-4 rounded-xl border-2 border-primary-fixed text-primary font-bold hover:bg-primary-fixed/10 transition-colors">Start Free Trial</button>
            </div>
            {/* Priority */}
            <div className="bg-white p-10 rounded-2xl flex flex-col shadow-xl border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Most Popular</div>
              <h3 className="font-headline text-xl font-bold text-primary mb-2">Priority</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-primary">$329</span>
                <span className="text-secondary">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-on-surface font-semibold text-sm">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> Off-Market Access
                </li>
                {['Unlimited Listings', 'Priority Match AI', 'Topographic Analysis Reports', 'Identity Verified Badge'].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-on-surface font-semibold text-sm">
                    <span className="material-symbols-outlined text-primary text-lg">check</span> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-4 rounded-xl bg-primary text-white font-bold hover:shadow-lg transition-all">Get Priority Access</button>
            </div>
            {/* Exclusive */}
            <div className="bg-white p-10 rounded-2xl flex flex-col shadow-sm">
              <h3 className="font-headline text-xl font-bold text-primary mb-2">Exclusive</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-primary">$799</span>
                <span className="text-secondary">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {['Everything in Priority', 'Custom API Land Sourcing', 'Dedicated Acquisition Manager', 'Legal Document Templates'].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-on-surface-variant text-sm">
                    <span className="material-symbols-outlined text-primary text-lg">check</span> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-4 rounded-xl border-2 border-primary-fixed text-primary font-bold hover:bg-primary-fixed/10 transition-colors">Contact Enterprise</button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: Final CTA */}
      <section className="py-24 bg-primary px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight">Your Next Land Deal Is Already on LotScout</h2>
          <p className="text-on-primary-container text-lg md:text-xl mb-12 max-w-2xl mx-auto">While you&apos;re reading this, buyers and sellers are matching right now. Don&apos;t let another deal close without you.</p>
          <button className="bg-white text-primary px-10 py-5 rounded-xl font-bold text-xl shadow-2xl hover:bg-surface-container-low transition-colors scale-95 active:scale-90 transition-transform">Get Started Free</button>
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
