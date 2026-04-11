import Header from '@/components/Header';

export default function DashboardPage() {
  return (
    <div className="bg-[#f7f9fb] font-body min-h-screen">
      <Header />

      <main className="pt-20 pb-24 max-w-screen-2xl mx-auto px-8 space-y-8">

        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between pt-6">
          <div>
            <p className="text-secondary text-xs font-bold uppercase tracking-[0.18em] mb-1">Good morning</p>
            <h1 className="font-headline text-4xl font-extrabold text-[#1B4332] tracking-tight leading-none">Alex Rivers</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-secondary text-sm">
              <span className="material-symbols-outlined text-base">calendar_today</span>
              Wednesday, April 9, 2026
            </div>
            <a href="/property-analysis" className="inline-flex items-center gap-2 bg-[#1B4332] text-white font-headline font-bold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[#1B4332]/25">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
              Analyze Property
            </a>
          </div>
        </div>

        {/* ── Quick Action Pills ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { icon: 'add_location_alt', label: 'New Listing',    href: '/marketplace'       },
            { icon: 'group',            label: 'Find Buyers',    href: '/buyer-directory'   },
            { icon: 'chat_bubble',      label: 'Messages',       href: '/messaging'         },
            { icon: 'person',           label: 'My Profile',     href: '/profile'           },
            { icon: 'sell',             label: 'Marketplace',    href: '/marketplace'       },
            { icon: 'payments',         label: 'Upgrade Plan',   href: '/pricing'           },
          ].map(({ icon, label, href }) => (
            <a
              key={label}
              href={href}
              className="flex items-center gap-2 bg-white border border-outline-variant/30 text-[#1B4332] text-xs font-bold px-4 py-2.5 rounded-full hover:bg-[#1B4332] hover:text-white hover:border-[#1B4332] hover:shadow-md transition-all duration-150"
            >
              <span className="material-symbols-outlined text-sm">{icon}</span>
              {label}
            </a>
          ))}
        </div>

        {/* ── ACTION REQUIRED ── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <h2 className="font-headline text-xs font-black text-rose-600 uppercase tracking-[0.2em]">Action Required</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT — New Messages */}
            <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden flex flex-col">
              {/* Card Header */}
              <div className="bg-[#1B4332] px-7 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                  <div>
                    <h3 className="font-headline font-extrabold text-white text-lg leading-none">New Messages</h3>
                    <p className="text-white/50 text-xs mt-0.5">3 unread conversations</p>
                  </div>
                </div>
                <a href="/messaging" className="text-white/60 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors">
                  View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

              {/* Message Rows */}
              <div className="flex-1 divide-y divide-outline-variant/10">
                {[
                  {
                    initials: 'MV', name: 'Marcus Vance',   role: 'Buyer',  property: 'Blackwood Ridge',
                    msg: 'The soil analysis reports came back positive. How do you want to proceed with the title transfer?',
                    time: '2 min ago',
                  },
                  {
                    initials: 'SO', name: 'Sarah Okafor',   role: 'Buyer',  property: 'Blue Ridge Plateau',
                    msg: 'Can you share the updated zoning map for the northeast parcel before our call on Friday?',
                    time: '1 hr ago',
                  },
                  {
                    initials: 'JT', name: 'Julian Thorne',  role: 'Seller', property: 'Oconee Lake Parcel',
                    msg: "I've reviewed the topographical survey and everything looks correct. Ready to move forward.",
                    time: 'Yesterday',
                  },
                ].map(({ initials, name, role, property, msg, time }) => (
                  <div key={name} className="flex items-start gap-4 px-7 py-5 hover:bg-[#f7f9fb] transition-colors">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#1B4332]/10 flex items-center justify-center font-headline font-extrabold text-[#1B4332] text-sm shrink-0">
                      {initials}
                    </div>
                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-headline font-extrabold text-[#1B4332] text-sm">{name}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded ${role === 'Buyer' ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'}`}>{role}</span>
                        <span className="text-secondary text-[10px] ml-auto shrink-0">{time}</span>
                      </div>
                      <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mb-1.5">
                        <span className="material-symbols-outlined text-sm">landscape</span>{property}
                      </p>
                      <p className="text-secondary text-xs leading-relaxed line-clamp-2">{msg}</p>
                    </div>
                    {/* CTA */}
                    <a
                      href="/messaging"
                      className="shrink-0 bg-[#1B4332] text-white text-[11px] font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                    >
                      Reply
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Matched Buyers */}
            <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden flex flex-col">
              {/* Card Header */}
              <div className="bg-[#1B4332] px-7 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
                  <div>
                    <h3 className="font-headline font-extrabold text-white text-lg leading-none">Matched Buyers</h3>
                    <p className="text-white/50 text-xs mt-0.5">2 new high-confidence matches</p>
                  </div>
                </div>
                <a href="/buyer-directory" className="text-white/60 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors">
                  Directory <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

              {/* Buyer Rows */}
              <div className="flex-1 divide-y divide-outline-variant/10">
                {[
                  {
                    initial: 'T', name: 'Terra Capital Group', contact: 'Alex Rivers',
                    budget: '$2M – $15M', target: 'Agricultural / Solar', acres: '500–2,500 AC',
                    states: ['NC','GA','SC'], match: 98, isNew: true,
                  },
                  {
                    initial: 'R', name: 'Ridgeline Partners', contact: 'Dana Sutton',
                    budget: '$500K – $3M', target: 'Residential Development', acres: '50–300 AC',
                    states: ['TN','VA','NC'], match: 94, isNew: true,
                  },
                  {
                    initial: 'H', name: 'Heartland REIT', contact: 'Troy Kimura',
                    budget: '$1M – $8M', target: 'Timber / Conservation', acres: '200–1,000 AC',
                    states: ['NC','WV','KY'], match: 87, isNew: false,
                  },
                  {
                    initial: 'S', name: 'Summit Land LLC', contact: 'Priya Nair',
                    budget: '$250K – $1.5M', target: 'Recreational / Off-Grid', acres: '10–100 AC',
                    states: ['GA','FL','AL'], match: 82, isNew: false,
                  },
                ].map(({ initial, name, contact, budget, target, acres, states, match, isNew }) => (
                  <div key={name} className="flex items-center gap-4 px-7 py-5 hover:bg-[#f7f9fb] transition-colors">
                    {/* Logo placeholder */}
                    <div className="w-11 h-11 rounded-xl bg-[#1B4332]/8 border border-[#1B4332]/10 flex items-center justify-center font-headline font-extrabold text-[#1B4332] text-lg shrink-0">
                      {initial}
                    </div>
                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-headline font-extrabold text-[#1B4332] text-sm truncate">{name}</span>
                        {isNew && <span className="shrink-0 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded">New</span>}
                      </div>
                      <p className="text-secondary text-xs">{contact} &bull; {target}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="font-headline font-extrabold text-[#1B4332] text-sm">{budget}</span>
                        <span className="text-secondary text-xs">&bull; {acres}</span>
                        <div className="flex gap-1 ml-1">
                          {states.map(s => <span key={s} className="text-[9px] font-bold bg-slate-100 text-secondary px-1.5 py-0.5 rounded">{s}</span>)}
                        </div>
                      </div>
                    </div>
                    {/* Match + CTA */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${match >= 95 ? 'bg-emerald-100 text-emerald-800' : match >= 88 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-secondary'}`}>
                        {match}% match
                      </span>
                      <a
                        href="/buyer-directory"
                        className="bg-[#1B4332] text-white text-[11px] font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Secondary Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT — Completed Reports */}
          <section className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant/10">
              <div>
                <h2 className="font-headline text-base font-extrabold text-[#1B4332]">Completed Reports</h2>
                <p className="text-secondary text-xs mt-0.5">AI-scored deal analysis</p>
              </div>
              <a href="/property-analysis" className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-[#1B4332] bg-[#f7f9fb] px-3 py-1.5 rounded-lg transition-colors">
                New Report <span className="material-symbols-outlined text-sm">add</span>
              </a>
            </div>
            <div className="divide-y divide-outline-variant/10">
              {[
                { name: 'Blackwood Ridge',    location: 'Asheville, NC',   date: 'Apr 7, 2026',  score: 94 },
                { name: 'Willow Creek Valley',location: 'Marshall, NC',    date: 'Mar 28, 2026', score: 81 },
                { name: 'Oconee Lake Parcel', location: 'Greensboro, GA',  date: 'Mar 15, 2026', score: 76 },
              ].map(({ name, location, date, score }) => {
                const strokeColor = score >= 90 ? '#10b981' : score >= 75 ? '#f59e0b' : '#f87171';
                const trackColor  = score >= 90 ? '#d1fae5' : score >= 75 ? '#fef3c7' : '#fee2e2';
                const C = 2 * Math.PI * 22;
                return (
                  <div key={name} className="flex items-center gap-5 px-7 py-4 hover:bg-[#f7f9fb] transition-colors group">
                    {/* Score ring */}
                    <div className="relative w-14 h-14 shrink-0">
                      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="22" fill="none" stroke={trackColor} strokeWidth="4" />
                        <circle cx="28" cy="28" r="22" fill="none" stroke={strokeColor} strokeWidth="4"
                          strokeDasharray={C} strokeDashoffset={C - (score / 100) * C} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-headline font-extrabold text-sm text-[#1B4332] leading-none">{score}</span>
                        <span className="text-[8px] text-secondary">/100</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-headline font-extrabold text-[#1B4332] text-sm truncate">{name}</p>
                      <p className="text-secondary text-xs mt-0.5">{location}</p>
                      <p className="text-secondary text-[10px] mt-0.5">{date}</p>
                    </div>
                    <a
                      href="/property-analysis"
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 border border-[#1B4332]/20 text-[#1B4332] text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-[#1B4332] hover:text-white transition-all"
                    >
                      View
                    </a>
                  </div>
                );
              })}
            </div>
          </section>

          {/* RIGHT — New Listings For You */}
          <section className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant/10">
              <div>
                <h2 className="font-headline text-base font-extrabold text-[#1B4332]">New Listings For You</h2>
                <p className="text-secondary text-xs mt-0.5">Matched to your acquisition criteria</p>
              </div>
              <a href="/marketplace" className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-[#1B4332] bg-[#f7f9fb] px-3 py-1.5 rounded-lg transition-colors">
                Marketplace <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
            <div className="divide-y divide-outline-variant/10">
              {[
                {
                  name: 'Elderwood Peak Estates', location: 'Fletcher, NC', price: '$3,200,000', acres: '210 AC', zoning: 'AG-1',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4cef9biofTlffz4fGxdBvBcFwiHk08cIU4yzKTEhK3afJ4HaoL3UWhyDbH8zrJZdXZAz7mDd7hXt9XA55yTuAWFO609h1Lu9SJRBUrA0NkaAUPMCoFvnbZZNjkbfsZO3e8s_rmlQvZR2GKdjrXwFG5BAGYgDsFM0GLo9wHIbINGGkzVyBz__YnK1fIH506blOh3xUSg6_lzcoqVRcBFuWB8ApuaU6espnPad_2RqCfHk64iOaS-F-irR6V9Am2nR2Lum2rDIhIXEo',
                },
                {
                  name: 'Sunridge Solar Tract',   location: 'Statesville, NC', price: '$5,750,000', acres: '640 AC', zoning: 'IND-L',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJMSHPOmwAvAD7VClrUjMXhcGCDU9q3sKuFfmaU2DEaIw7_TYd2jQfOQ3zo7BmCnhz1ao4DMTqsMIsMA-c1pEk2iAH72ZIZuZnQyv9ctsnmKx_OT5Cwzf9GP0lcuDWUG93PHuihWwldDwtsztABXpMDW0RPmnxYQuM2gVDW_sl273zD0_H4krJOzPVOxrS-YT7hC-prTFIdFy4L4M7Omq_Y9maXzUIbQUGLGgZTqiN9HKC1aZVyUOZmQTJ9bpMaFAulQVdrOMXb_du',
                },
                {
                  name: 'Hawthorn Creek Parcel',  location: 'Toccoa, GA',   price: '$1,100,000', acres: '88 AC',  zoning: 'RES-L',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYyWMJLhn15jf1B5gXtnCrDXEnj9MVUFI1sGrfmUIZQ0o9tQLgvcgHrjCIOUmaQoC5InXyQ5Iz750wxX-0bG4dfHaK0eYqlFxR6I5DjOGnIXW7PJlMTnooYfgYPXj7nalhDCnBrIurTEPtjl3PqREQfFIE1Y3DDFnFpSWV8L97nKTjuHjfCqDq6Qt0NVoVSGLfhE3jRLx1xzwVpGRbMniKi-sGswANlCMohSCM3hudUWvAZUQrfski7KOP7fIz3RbirwGx-vyggx9c',
                },
              ].map(({ name, location, price, acres, zoning, img }) => (
                <div key={name} className="flex items-stretch hover:bg-[#f7f9fb] transition-colors group cursor-pointer">
                  {/* Image */}
                  <div className="w-24 shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 flex items-center gap-4 px-6 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-headline font-extrabold text-[#1B4332] text-sm truncate">{name}</p>
                      <p className="text-secondary text-xs flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-sm">location_on</span>{location}
                      </p>
                      <span className="inline-block mt-1.5 text-[10px] font-bold bg-slate-100 text-secondary px-2 py-0.5 rounded">{zoning}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-headline font-extrabold text-[#1B4332] text-sm">{price}</p>
                      <p className="text-secondary text-xs mt-0.5">{acres}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Weekly Market Update ── */}
        <section className="bg-[#1B4332] rounded-2xl overflow-hidden relative min-h-[220px]">
          {/* Dot-grid pattern */}
          <div className="absolute inset-0 opacity-[0.045]" style={{
            backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
          }}></div>
          {/* Ambient blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 px-12 py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
            <div className="flex-1 max-w-2xl space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-emerald-400/20 border border-emerald-400/25 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full">
                  Weekly Market Update
                </span>
                <span className="text-white/30 text-xs">Apr 7 – 13, 2026</span>
              </div>
              <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
                Southeast land values up <span className="text-emerald-400">6.2%</span> YoY — solar demand driving premiums in NC &amp; GA.
              </h2>
              <p className="text-white/50 text-sm leading-relaxed max-w-xl">
                Utility-scale solar inquiries increased 41% this quarter. Parcels over 500 acres in your target geographies average 18 days on market — down from 26 days last quarter.
              </p>
            </div>
            <div className="flex lg:flex-col gap-4 shrink-0">
              {[
                { value: '+41%',    label: 'Solar Inquiries',     highlight: false },
                { value: '18 days', label: 'Avg. Time on Market', highlight: true  },
                { value: '+9.1%',   label: 'Timber Appreciation', highlight: false },
              ].map(({ value, label, highlight }) => (
                <div key={label} className="bg-white/8 border border-white/10 rounded-2xl px-8 py-5 text-center min-w-[140px]">
                  <p className={`font-headline font-extrabold text-2xl ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
