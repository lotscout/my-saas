'use client';

import Header from '@/components/Header';

const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export default function DashboardPage() {
  return (
    <div className="bg-surface text-on-surface antialiased font-body">
      <Header />

      <main className="max-w-[1440px] mx-auto pt-24 pb-12 px-8">

        {/* Dashboard Header */}
        <header className="flex justify-between items-end mb-10">
          <div>
            <p className="text-secondary font-medium tracking-wide uppercase text-xs mb-1">Overview</p>
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight">Good Morning, <span className="text-emerald-600">Alexander</span></h1>
          </div>
          <div className="text-right">
            <p className="text-secondary font-semibold font-body">{today}</p>
            <p className="text-on-surface-variant text-sm">Central Texas Market • Open</p>
          </div>
        </header>

        {/* Quick Actions */}
        <section className="flex flex-wrap gap-3 mb-12">
          {[
            { icon: 'analytics',   label: 'Analyze a Property', href: '/property-analysis' },
            { icon: 'explore',     label: 'Browse Marketplace', href: '/marketplace'        },
            { icon: 'groups',      label: 'Find Buyers',        href: '/buyer-directory'    },
            { icon: 'add_circle',  label: 'Create Listing',     href: '/marketplace'        },
          ].map(({ icon, label, href }) => (
            <a
              key={label}
              href={href}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-surface-container-lowest shadow-sm hover:shadow-md transition-all group border border-outline-variant/10"
            >
              <span className="material-symbols-outlined text-primary">{icon}</span>
              <span className="text-sm font-semibold text-primary">{label}</span>
            </a>
          ))}
        </section>

        {/* Action Required: Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

          {/* New Messages */}
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="bg-primary px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold tracking-tight text-lg">New Messages (3)</h3>
              <span className="material-symbols-outlined text-white/70">mail</span>
            </div>
            <div className="divide-y divide-surface-container">

              {/* Message Row 1 */}
              <div className="p-6 flex items-start gap-4 hover:bg-surface-container-low transition-colors cursor-pointer group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-12 h-12 rounded-xl object-cover"
                  alt="professional headshot of a woman with smiling face against a soft blue background"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvRHD0OpZZRU9JrC2Sy7E0enZllr5wIzyz3JAMagW7YTI8-Ac-lyRZmP7c88pjB7kbOHbR8ZYeUtS5-OfIjTBmzBTz8RNFfZ8K6AIVZkRFR9jDl3zvObT2wuuDv_lKsls2ATBhKNno8DZvjYDIwuQNHQ30wRYg-7YXq1-0-CY8-qoNSSaqkQMTbvZEzTLBNwKk6Hsv1BLNRgxPgwLo53bTPhsnVbcaeDN4S1oAULguBaU9Qk1V_f4A0M4IOZ7EUk5NZa_5noA3gMm0"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-on-surface">Sarah Jenkins</h4>
                    <span className="text-xs text-on-surface-variant">2m ago</span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">Oak Creek Ranch</span>
                  </div>
                  <p className="text-sm text-secondary line-clamp-1">Can we schedule a call to discuss the drainage easements on the north lot?</p>
                </div>
                <a href="/messaging" className="self-center opacity-0 group-hover:opacity-100 bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all">Reply</a>
              </div>

              {/* Message Row 2 */}
              <div className="p-6 flex items-start gap-4 hover:bg-surface-container-low transition-colors cursor-pointer group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-12 h-12 rounded-xl object-cover"
                  alt="portrait of a man in professional attire with neutral expression"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIEbdU_XBeUc9QMCcf2BmIl5pUqH46CAAtlPhjvPOnf4w28S4SSdZvuaxbR60v_YZTsYkxqno_tYrdPIRNPc48v5TBhQhaGrogA_ZbA996R1GVKbwf38sHfC2JD7qJ7yY1fa2FNITiWhSCrMbHC5I9PwWbb7w6qYG7dgvvaNdm43o88RZS_-P_7zBcIPH7RFrWHqn_5HQUbdO7jgpBtpNBiowpXLaO4wrPNyLhVUcM79ZvkLT97RE98wWUsjTnTHMw196x3KvSCCho"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-on-surface">Michael Chen</h4>
                    <span className="text-xs text-on-surface-variant">1h ago</span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">Investor</span>
                  </div>
                  <p className="text-sm text-secondary line-clamp-1">I&apos;ve reviewed the report for Pecan Grove. Let&apos;s talk about the rezoning timeline.</p>
                </div>
                <a href="/messaging" className="self-center opacity-0 group-hover:opacity-100 bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all">Reply</a>
              </div>

              {/* Message Row 3 */}
              <div className="p-6 flex items-start gap-4 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary">apartment</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-on-surface">Urban Dev Group</h4>
                    <span className="text-xs text-on-surface-variant">4h ago</span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">Acquisition</span>
                  </div>
                  <p className="text-sm text-secondary line-clamp-1">Proposal sent for the downtown commercial site. Please confirm receipt.</p>
                </div>
                <a href="/messaging" className="self-center opacity-0 group-hover:opacity-100 bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all">Reply</a>
              </div>

            </div>
          </div>

          {/* Matched Buyers */}
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col border border-outline-variant/10">
            <div className="px-6 py-4 flex justify-between items-center border-b border-outline-variant/5">
              <h3 className="text-primary font-bold tracking-tight text-lg">Matched Buyers (2)</h3>
              <span className="material-symbols-outlined text-primary">hub</span>
            </div>
            <div className="p-6 space-y-6">

              {/* Match 1 */}
              <div className="relative group">
                <div className="absolute -inset-2 rounded-2xl bg-surface-container-low scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200"></div>
                <div className="relative flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full border-[3px] border-primary-fixed-dim p-1">
                    <div className="w-full h-full bg-primary flex items-center justify-center rounded-full text-white font-bold text-xl">98</div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-on-surface text-lg">Vanguard Land Trust</h4>
                    <p className="text-sm text-secondary mb-2">Seeking: Agricultural/Conservation (50+ Acres)</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase">Cash Buyer</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase">Multi-Parcel</span>
                    </div>
                  </div>
                  <a href="/buyer-directory" className="bg-surface-container-high text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all">View Profile</a>
                </div>
              </div>

              {/* Match 2 */}
              <div className="relative group">
                <div className="absolute -inset-2 rounded-2xl bg-surface-container-low scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200"></div>
                <div className="relative flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full border-[3px] border-primary-fixed-dim p-1">
                    <div className="w-full h-full bg-primary flex items-center justify-center rounded-full text-white font-bold text-xl">89</div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-on-surface text-lg">BuildWorks Inc.</h4>
                    <p className="text-sm text-secondary mb-2">Seeking: Light Industrial (5-10 Acres)</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase">Qualified 1031</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase">Regional</span>
                    </div>
                  </div>
                  <a href="/buyer-directory" className="bg-surface-container-high text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all">View Profile</a>
                </div>
              </div>

            </div>
            <div className="mt-auto px-6 py-4 bg-surface-container-low/50">
              <p className="text-xs text-secondary italic">Your property matching algorithm updated 12 minutes ago.</p>
            </div>
          </div>

        </section>

        {/* Secondary Row */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-12">

          {/* Completed Reports */}
          <div className="xl:col-span-5 bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
            <h3 className="text-primary font-bold tracking-tight text-xl mb-6 font-headline">Completed Reports</h3>
            <div className="space-y-6">
              {[
                { name: 'Rolling Hills Estate', time: '2h ago',       score: 94 },
                { name: 'Willow Creek 40',       time: 'Yesterday',    score: 88 },
                { name: 'Airport Link North',    time: '3 days ago',   score: 91 },
              ].map(({ name, time, score }) => (
                <div key={name} className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full border-4 border-emerald-100 flex items-center justify-center">
                      <span className="text-primary font-bold text-lg">{score}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">{name}</h4>
                      <p className="text-xs text-secondary">Analyzed: {time}</p>
                    </div>
                  </div>
                  <a href="/property-analysis" className="flex items-center gap-1 text-primary font-bold text-sm hover:underline">
                    View Report
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* New Listings For You */}
          <div className="xl:col-span-7">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="text-primary font-bold tracking-tight text-xl font-headline">New Listings For You</h3>
              <a className="text-secondary font-semibold text-sm hover:text-primary transition-colors" href="/marketplace">See all matches</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Property Card 1 */}
              <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
                <div className="relative h-48 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt="vast green field under a clear blue sky at sunset with soft rolling hills in the distance"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBiuS0dd1JdNZb7ICDGwXN7NSohNfaOPkzWuZx-BaJIwguMUWF3V-_J81aEuLAszNyRNDvsecu2YQxRsKXcPKz5aUACOOwPoD_RFt9ZCi6o27wkRbH6hBH3fpN21-CZJfSDL9Lxf2tL2suD7opSKUPSDKh1tG5Tp3npIsy81VJ3am4nFfxqxbFs2JKKjzxjE_kg87OtVL-4O5rAkLGmrh4qjr42R4oHRazipl-Z3YAz5X4yP8R5JEIsZdgyA_5WQgxnt7ZO2rM56qz"
                  />
                  <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Featured</div>
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-primary font-bold text-sm">$450,000</div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-on-surface mb-1">Meadow View Ridge</h4>
                  <p className="text-xs text-secondary mb-4">Hays County, TX</p>
                  <div className="flex gap-2">
                    <span className="bg-secondary-fixed-dim text-on-secondary-fixed px-2 py-1 rounded-md text-[10px] font-bold uppercase">12.5 Acres</span>
                    <span className="bg-secondary-fixed-dim text-on-secondary-fixed px-2 py-1 rounded-md text-[10px] font-bold uppercase">Residential</span>
                  </div>
                </div>
              </div>

              {/* Property Card 2 */}
              <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
                <div className="relative h-48 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt="aerial photography of a dense forest with a clearing in the center, golden morning light filtering through trees"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3cNpbV1Ub5UtDgUdB7aArdAMBdei5QfNrajCMzgR9L-Cz8_OOwU9ddMIQV5I-YWFVirv9RzsK0AlgYKJ4lBpghtRFVtgCgnPQE5VaeZu1HMGlTht7VRj0eeMl4kTVfvsts-bn9DS1Emn6cDE9lGHr3rVu6AaOmgOm-OXNyFaKm-DOqvEjwFaXA0gJBQc9a-JCfRwC1dFNoero9LZ3Zp3ATuXwYSbqlTEtgrehOuqK12-pRxGxIykMYgNQ5fnJ8uh6E-jkjBePxt_V"
                  />
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-primary font-bold text-sm">$1,200,000</div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-on-surface mb-1">Cedar Creek Sanctuary</h4>
                  <p className="text-xs text-secondary mb-4">Bastrop, TX</p>
                  <div className="flex gap-2">
                    <span className="bg-secondary-fixed-dim text-on-secondary-fixed px-2 py-1 rounded-md text-[10px] font-bold uppercase">45.0 Acres</span>
                    <span className="bg-secondary-fixed-dim text-on-secondary-fixed px-2 py-1 rounded-md text-[10px] font-bold uppercase">Agricultural</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* Weekly Market Update: Full Width Hero */}
        <section className="bg-primary rounded-[2rem] p-10 relative overflow-hidden text-white shadow-2xl">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
            <div className="w-full h-full bg-gradient-to-l from-emerald-400 to-transparent"></div>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-[0.2em] border border-emerald-500/30">Live Update</span>
                <span className="text-emerald-100/60 text-xs font-medium italic">May 10 – May 17, 2024</span>
              </div>
              <h2 className="text-5xl font-extrabold tracking-tighter mb-6 leading-none font-headline">The Digital Cartographer Weekly</h2>
              <p className="text-emerald-100/70 text-lg font-body max-w-xl mb-8 leading-relaxed">
                Central Texas land value continues to surge, showing a 4.2% increase in industrial-zoned parcels. Discover how current infrastructure projects are shifting the buyer landscape.
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  { label: 'Austin MSA',  value: '+5.2%' },
                  { label: 'San Marcos',  value: '+3.8%' },
                  { label: 'Kyle/Buda',   value: '+6.1%' },
                ].map(({ label, value }) => (
                  <div key={label} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">{label}</span>
                    <span className="text-xl font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                <h4 className="text-emerald-300 font-bold uppercase tracking-widest text-xs mb-6">Land Type Spotlight</h4>
                <div className="space-y-4">
                  {[
                    { label: 'Light Industrial', icon: 'trending_up',   iconColor: 'text-emerald-400' },
                    { label: 'Multi-Family',      icon: 'trending_up',   iconColor: 'text-emerald-400' },
                    { label: 'Agricultural',      icon: 'trending_flat', iconColor: 'text-white/40'    },
                  ].map(({ label, icon, iconColor }) => (
                    <div key={label} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                      <span className="font-bold">{label}</span>
                      <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-8 bg-emerald-500 hover:bg-emerald-400 text-primary font-extrabold py-4 rounded-2xl transition-all">
                  Read Full Market Analysis
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-emerald-900/5 bg-slate-50">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 max-w-[1440px] mx-auto">
          <div className="mb-6 md:mb-0">
            <span className="font-headline font-bold text-emerald-900 text-lg">LotScout</span>
            <p className="text-slate-500 text-sm mt-1">&copy; 2024 LotScout. The Digital Cartographer.</p>
          </div>
          <div className="flex gap-8">
            <a className="text-slate-500 hover:text-emerald-600 transition-colors text-sm font-medium" href="#">Privacy Policy</a>
            <a className="text-slate-500 hover:text-emerald-600 transition-colors text-sm font-medium" href="#">Terms of Service</a>
            <a className="text-slate-500 hover:text-emerald-600 transition-colors text-sm font-medium" href="#">Support</a>
            <a className="text-slate-500 hover:text-emerald-600 transition-colors text-sm font-medium" href="#">API Documentation</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
