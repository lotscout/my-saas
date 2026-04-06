import Header from '@/components/Header';

export default function BuyerDirectoryPage() {
  return (
    <div className="bg-surface text-on-surface selection:bg-emerald-100 selection:text-emerald-900">
      <Header />

      {/* Main Content Area */}
      <main className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-12">
          {/* Hero Header Section */}
          <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-black text-[#1B4332] leading-[0.9] mb-6">
                Buyer <span className="text-emerald-600">Directory</span>
              </h1>
              <p className="text-slate-600 text-lg font-body max-w-lg leading-relaxed">
                Navigate our curated network of active land acquisition firms and private investors seeking their next high-value opportunity.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white border border-slate-100 px-8 py-5 rounded-2xl shadow-sm text-center">
                <div className="text-3xl font-black text-[#1B4332]">1,284</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Active Buyers</div>
              </div>
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
                  {/* Search Field */}
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
                  {/* Budget Range */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Min. Budget (USD)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="bg-emerald-900 text-white py-2.5 text-xs font-bold rounded-lg transition-all">Any</button>
                      <button className="bg-slate-50 py-2.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">$1M+</button>
                      <button className="bg-slate-50 py-2.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">$10M+</button>
                      <button className="bg-slate-50 py-2.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">$50M+</button>
                    </div>
                  </div>
                  {/* Acreage Requirements */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Minimum Acreage</label>
                    <input className="w-full accent-[#1B4332] mt-2" type="range" />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                      <span>0 AC</span>
                      <span>5,000+ AC</span>
                    </div>
                  </div>
                  {/* Region Multi-select */}
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

              {/* Market Status Component */}
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

            {/* Buyer List Section */}
            <div className="xl:col-span-3 space-y-6">
              {/* Buyer Card 1 */}
              <div className="bg-white p-8 rounded-3xl group hover:border-emerald-900/20 transition-all duration-300 flex flex-col md:flex-row gap-8 items-start border border-slate-100 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-3xl text-[#1B4332]">corporate_fare</span>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-[#1B4332] group-hover:text-emerald-700 transition-colors">Meridian Land Holdings</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Institutional Equity Firm • Denver, CO</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">Aggressive Acquisition</span>
                      <span className="px-4 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full">Verified Capital</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Regions</p>
                      <p className="text-sm font-bold text-emerald-900">PNW, Rockies, NorCal</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Budget Range</p>
                      <p className="text-sm font-bold text-emerald-900">$15M – $120M</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Min. Acreage</p>
                      <p className="text-sm font-bold text-emerald-900">450 Acres</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Use Case</p>
                      <p className="text-sm font-bold text-emerald-900">Conservation/Eco-Resort</p>
                    </div>
                  </div>
                </div>
                <button className="shrink-0 self-center md:self-start bg-[#1B4332] text-white p-4 rounded-full hover:scale-105 transition-transform shadow-md">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>

              {/* Buyer Card 2 */}
              <div className="bg-white p-8 rounded-3xl group hover:border-emerald-900/20 transition-all duration-300 flex flex-col md:flex-row gap-8 items-start border border-slate-100 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-3xl text-[#1B4332]">agriculture</span>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-[#1B4332] group-hover:text-emerald-700 transition-colors">Vanguard Agrarian Trust</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Agricultural REIT • Chicago, IL</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">Active Bidding</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Regions</p>
                      <p className="text-sm font-bold text-emerald-900">Midwest, Great Plains</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Budget Range</p>
                      <p className="text-sm font-bold text-emerald-900">$5M – $45M</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Min. Acreage</p>
                      <p className="text-sm font-bold text-emerald-900">1,200 Acres</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Use Case</p>
                      <p className="text-sm font-bold text-emerald-900">Row Crop Production</p>
                    </div>
                  </div>
                </div>
                <button className="shrink-0 self-center md:self-start bg-[#1B4332] text-white p-4 rounded-full hover:scale-105 transition-transform shadow-md">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>

              {/* Buyer Card 3 */}
              <div className="bg-white p-8 rounded-3xl group hover:border-emerald-900/20 transition-all duration-300 flex flex-col md:flex-row gap-8 items-start border border-slate-100 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-3xl text-[#1B4332]">forest</span>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-[#1B4332] group-hover:text-emerald-700 transition-colors">Oak &amp; Stone Collective</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Private Investment Group • Austin, TX</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">Off-Market Only</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Regions</p>
                      <p className="text-sm font-bold text-emerald-900">Southeast, Appalachian</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Budget Range</p>
                      <p className="text-sm font-bold text-emerald-900">$2M – $12M</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Min. Acreage</p>
                      <p className="text-sm font-bold text-emerald-900">100 Acres</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Use Case</p>
                      <p className="text-sm font-bold text-emerald-900">Timberland / Recreational</p>
                    </div>
                  </div>
                </div>
                <button className="shrink-0 self-center md:self-start bg-[#1B4332] text-white p-4 rounded-full hover:scale-105 transition-transform shadow-md">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>

              {/* Pagination */}
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

      {/* Footer */}
      <footer className="bg-emerald-950 w-full py-12 px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 w-full max-w-7xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="LotScout Logo"
                className="h-8 w-auto"
                src="/logo.png"
              />
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
