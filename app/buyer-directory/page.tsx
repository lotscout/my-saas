'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import LockedFeature from '@/components/LockedFeature';
import { useUserTier } from '@/hooks/useUserTier';

const BUYERS = [
  {
    id: 1,
    icon: 'corporate_fare',
    name: 'Meridian Land Holdings',
    subtitle: 'Institutional Equity Firm • Denver, CO',
    email: 'acquisitions@meridianland.com',
    phone: '+1 (303) 555-0147',
    badges: ['Aggressive Acquisition', 'Verified Capital'],
    badgeColors: ['bg-emerald-50 text-emerald-700', 'bg-amber-50 text-amber-700'],
    regions: 'PNW, Rockies, NorCal',
    budget: '$15M – $120M',
    acreage: '450 Acres',
    useCase: 'Conservation/Eco-Resort',
  },
  {
    id: 2,
    icon: 'agriculture',
    name: 'Vanguard Agrarian Trust',
    subtitle: 'Agricultural REIT • Chicago, IL',
    email: 'land@vanguardagrarian.com',
    phone: '+1 (312) 555-0294',
    badges: ['Active Bidding'],
    badgeColors: ['bg-emerald-50 text-emerald-700'],
    regions: 'Midwest, Great Plains',
    budget: '$5M – $45M',
    acreage: '1,200 Acres',
    useCase: 'Row Crop Production',
  },
  {
    id: 3,
    icon: 'forest',
    name: 'Oak & Stone Collective',
    subtitle: 'Private Investment Group • Austin, TX',
    email: 'deals@oakstonecollective.com',
    phone: '+1 (512) 555-0381',
    badges: ['Off-Market Only'],
    badgeColors: ['bg-emerald-50 text-emerald-700'],
    regions: 'Southeast, Appalachian',
    budget: '$2M – $12M',
    acreage: '100 Acres',
    useCase: 'Timberland / Recreational',
  },
];

function ContactDetails({ buyer }: { buyer: typeof BUYERS[0] }) {
  return (
    <div>
      <h3 className="text-2xl font-black text-[#1B4332] group-hover:text-emerald-700 transition-colors">{buyer.name}</h3>
      <p className="text-sm text-slate-500 font-medium mt-1">{buyer.subtitle}</p>
      <div className="flex flex-wrap gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <span className="material-symbols-outlined text-sm text-emerald-700">mail</span>
          {buyer.email}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <span className="material-symbols-outlined text-sm text-emerald-700">phone</span>
          {buyer.phone}
        </span>
      </div>
    </div>
  );
}

export default function BuyerDirectoryPage() {
  const { isAtLeast, tier, loading } = useUserTier();
  const router = useRouter();
  const canViewContact = !loading && isAtLeast('priority');
  const [showFreeModal, setShowFreeModal] = useState(false);

  function handleFindProperty() {
    if (loading) return;
    if (!tier) { setShowFreeModal(true); return; }
    router.push('/create-buyer-request');
  }

  return (
    <div className="bg-surface text-on-surface selection:bg-emerald-100 selection:text-emerald-900">
      <Header />

      {showFreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFreeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowFreeModal(false)} className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-xl">close</span></button>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Find a Property</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">Posting buyer criteria requires a paid LotScout account. Choose a plan to get started.</p>
            <div className="flex gap-3">
              <a href="/pricing" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors">View Plans →</a>
              <button onClick={() => setShowFreeModal(false)} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="max-w-2xl">
              <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight mb-6">
                Buyer <span className="text-emerald-600">Directory</span>
              </h1>
              <p className="text-slate-600 text-lg font-body max-w-lg leading-relaxed">
                Navigate our curated network of active land acquisition firms and private investors seeking their next high-value opportunity.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white border border-slate-100 px-8 py-5 rounded-2xl shadow-sm text-center">
                <div className="text-3xl font-black text-[#1B4332]">1,284</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Active Buyers</div>
              </div>
              <button
                onClick={handleFindProperty}
                className="flex items-center gap-2 bg-[#1B4332] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-800 transition-colors shadow-lg"
              >
                <span className="material-symbols-outlined text-lg">search</span>
                Find a Property
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
            {/* Filter Sidebar */}
            <aside className="xl:col-span-1 space-y-8">
              <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
                <h4 className="text-[#1B4332] font-bold text-sm uppercase tracking-widest mb-6 flex items-center justify-between">
                  Search Filters
                  <span className="material-symbols-outlined text-xs">tune</span>
                </h4>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Company Name</label>
                    <div className="relative">
                      <input
                        className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        placeholder="Search buyers..."
                        type="text"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Min. Budget (USD)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="bg-emerald-900 text-white py-2.5 text-xs font-bold rounded-lg transition-all">Any</button>
                      <button className="bg-slate-50 py-2.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">$1M+</button>
                      <button className="bg-slate-50 py-2.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">$10M+</button>
                      <button className="bg-slate-50 py-2.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">$50M+</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Minimum Acreage</label>
                    <input className="w-full accent-[#1B4332] mt-2" type="range" />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                      <span>0 AC</span>
                      <span>5,000+ AC</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Focus Region</label>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-emerald-900 text-white text-[10px] font-bold rounded-full cursor-pointer">Pacific Northwest</span>
                      <span className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full cursor-pointer hover:bg-slate-100 transition-colors">Southeast</span>
                      <span className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full cursor-pointer hover:bg-slate-100 transition-colors">Appalachia</span>
                      <span className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full cursor-pointer hover:bg-slate-100 transition-colors">Midwest</span>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-8 py-3.5 bg-emerald-900 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-emerald-800 transition-colors shadow-sm">
                  Apply Analysis
                </button>
              </div>

              <div className="bg-emerald-900 p-8 rounded-3xl relative overflow-hidden group shadow-lg">
                <div className="relative z-10">
                  <h5 className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2">Market Sentiment</h5>
                  <div className="text-3xl font-black text-white mb-4 leading-tight">Bullish: Land Scarcity Rising</div>
                  <p className="text-emerald-100/70 text-xs leading-relaxed mb-6">Aggregate buyer activity has increased 14.2% since last quarter.</p>
                  <a className="text-white text-xs font-bold underline underline-offset-4 hover:text-emerald-400 transition-colors" href="#">View Market Report</a>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <span className="material-symbols-outlined text-9xl text-white">trending_up</span>
                </div>
              </div>
            </aside>

            {/* Buyer List */}
            <div className="xl:col-span-3 space-y-6">
              {BUYERS.map(buyer => (
                <div key={buyer.id} className="bg-white p-8 rounded-3xl group hover:border-emerald-900/20 transition-all duration-300 flex flex-col md:flex-row gap-8 items-start border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-3xl text-[#1B4332]">{buyer.icon}</span>
                  </div>

                  <div className="flex-1 space-y-4 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Contact details — locked for standard/free */}
                      {loading ? (
                        <div className="space-y-2 flex-1">
                          <div className="h-6 bg-slate-100 animate-pulse rounded w-48" />
                          <div className="h-4 bg-slate-100 animate-pulse rounded w-36" />
                          <div className="h-4 bg-slate-100 animate-pulse rounded w-56" />
                        </div>
                      ) : canViewContact ? (
                        <ContactDetails buyer={buyer} />
                      ) : (
                        <LockedFeature
                          requiredTier="priority"
                          message="Upgrade to Priority to view buyer contact details"
                          className="rounded-xl flex-1"
                        >
                          <ContactDetails buyer={buyer} />
                        </LockedFeature>
                      )}

                      <div className="flex gap-2 flex-wrap shrink-0">
                        {buyer.badges.map((badge, i) => (
                          <span key={badge} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full ${buyer.badgeColors[i]}`}>
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Criteria grid — always visible */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Regions</p>
                        <p className="text-sm font-bold text-emerald-900">{buyer.regions}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Budget Range</p>
                        <p className="text-sm font-bold text-emerald-900">{buyer.budget}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Min. Acreage</p>
                        <p className="text-sm font-bold text-emerald-900">{buyer.acreage}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Use Case</p>
                        <p className="text-sm font-bold text-emerald-900">{buyer.useCase}</p>
                      </div>
                    </div>
                  </div>

                  <Link href={`/buyer-requests/${buyer.id}`} className="shrink-0 self-center md:self-start bg-[#1B4332] text-white p-4 rounded-full hover:scale-105 transition-transform shadow-md">
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                </div>
              ))}

              <div className="flex justify-center pt-12">
                <button className="flex items-center gap-4 bg-white border border-slate-100 px-12 py-4 rounded-full text-emerald-900 font-bold text-xs uppercase tracking-widest hover:bg-emerald-900 hover:text-white transition-all shadow-sm">
                  Load Additional Buyers
                  <span className="material-symbols-outlined">expand_more</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-emerald-950 w-full py-12 px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 w-full max-w-7xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="LotScout Logo" className="h-8 w-auto" src="/logo.png" />
              <span className="text-white font-bold text-xl tracking-tighter font-['Manrope']">LotScout</span>
            </div>
            <p className="text-emerald-200/40 font-['Inter'] text-xs tracking-wide uppercase">© 2024 LotScout. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-8 justify-start md:justify-end">
            <a className="text-emerald-200/40 hover:text-white font-['Inter'] text-xs tracking-wide uppercase transition-colors" href="#">Terms of Service</a>
            <a className="text-emerald-200/40 hover:text-white font-['Inter'] text-xs tracking-wide uppercase transition-colors" href="#">Privacy Policy</a>
            <a className="text-emerald-200/40 hover:text-white font-['Inter'] text-xs tracking-wide uppercase transition-colors" href="#">Data Sources</a>
            <a className="text-emerald-200/40 hover:text-white font-['Inter'] text-xs tracking-wide uppercase transition-colors" href="#">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
