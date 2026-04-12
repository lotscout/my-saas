import Header from '@/components/Header';

export default function MarketplacePage() {
  return (
    <div className="bg-surface text-on-surface">
      <Header />

      {/* Main Content Canvas */}
      <main className="pt-24 px-10 pb-20 min-h-screen max-w-[1400px] mx-auto">
        {/* Hero Search / Title Section */}
        <section className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-2xl">
<h1 className="text-5xl font-black text-primary leading-tight mb-4 whitespace-nowrap">Scout Your <span className="text-emerald-600">Next Deal</span></h1>
            <p className="text-slate-500 font-body text-lg leading-relaxed">
              Advanced land acquisition powered by cartographic precision. Browse 2,400+ off-market listings throughout the U.S
            </p>
          </div>
          <div className="flex gap-2 bg-surface-container p-1 rounded-xl">
            <button className="px-6 py-2 bg-surface-container-lowest shadow-sm rounded-lg text-sm font-bold text-primary">Grid</button>
            <button className="px-6 py-2 text-slate-500 text-sm font-medium hover:text-primary transition-colors">Map View</button>
          </div>
        </section>

        {/* Dynamic Filter Bar */}
        <div className="grid grid-cols-12 gap-8 mb-12">
          <div className="col-span-12 flex flex-wrap items-center gap-4 py-6 border-y border-outline-variant/20">
            <div className="group relative">
              <button className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary">
                Acreage Range
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>
            </div>
            <div className="group relative">
              <button className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary">
                Zoning Type
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>
            </div>
            <div className="group relative">
              <button className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary">
                Utilities Access
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>
            </div>
            <div className="group relative">
              <button className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary">
                Soil Composition
              </button>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort By:</span>
              <select className="bg-transparent border-none text-sm font-bold text-primary focus:ring-0 cursor-pointer">
                <option>Newest First</option>
                <option>Price: High to Low</option>
                <option>Acreage: Largest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Promoted — Elderwood Peak Estates */}
          <div className="flex flex-col group">
            <div className="relative overflow-hidden rounded-2xl bg-surface-container-low aspect-video mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Aerial mountain vista"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxJzpl7PtPZ3P9-BbZWEnnurDCh6iCuzDzxd8ZqqT8JD-uoS6-tQYgI_5g7BnCOd1fs3CLCNTBes6QTw5XNx3DYg00cXSRnCDOV-ZtJM9W4SpVL9aDpq3c-K3x7DHVcOaQzcGxY23ECyKHXOCa9XhyhCMPPI_X5zQB49vCbRWK9mw81BYCTcpT41Tixw8YTyPaCHGElLbCoI2F7Ibp7h4rhUYZ6t3kCUX6-hXPN0VSjjTo3gKOFBoTlscbAUd9I2zokdmW_oU__CKd"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-amber-400 text-amber-950 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">workspace_premium</span>
                  Promoted
                </span>
              </div>
              <div className="absolute top-4 right-4">
                <span className="bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">Residential-A1</span>
              </div>
            </div>
            <div className="px-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-black text-primary">Elderwood Peak Estates</h3>
                <span className="text-3xl font-black text-primary">$4.25M</span>
              </div>
              <p className="text-slate-500 text-sm mb-4">Aspen Ridge, CO • 420.5 Acres</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-tighter">R-1 Agricultural</span>
                <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Well, Solar-Ready</span>
              </div>
            </div>
          </div>

          {/* Sutter Basin Flats */}
          <div className="flex flex-col group">
            <div className="relative overflow-hidden rounded-2xl bg-surface-container-low aspect-video mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Verdant plains"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4r8Hu0cQUcXuWX0WzV_2H0XqwnqPBMB2Fca9iPIFQXepEoRpS7nvtdqueP7eKmXCCpLpVbOoMXZAw0y3EUYLrYQgzam2dLiwITqadNzN_VqADUyY5_rZZ0nrwHcQbWCNUvqozu5VPXXJNMSu8bQxKsOkaWrpOetGX4J5YePqJyv013HCe5gyz6sakET7TkLMvrdeX5S4KHoiMziudlXEMOWm3WOKmrg1cYfTmrwfG2a1YP7q8n8g9nQDOWoR2j6yETU4PFUd46Ylq"
              />
              <div className="absolute top-4 right-4">
                <button className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm text-primary hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-lg">favorite</span>
                </button>
              </div>
              <div className="absolute bottom-4 left-4">
                <span className="bg-primary/90 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">Utility Ready</span>
              </div>
            </div>
            <div className="px-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-black text-primary">Sutter Basin Flats</h3>
                <span className="text-3xl font-black text-primary">$890k</span>
              </div>
              <p className="text-slate-500 text-sm mb-4">Sacramento Valley, CA • 64 Acres</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Prime Soil</span>
                <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Water Rights</span>
              </div>
            </div>
          </div>

          {/* Crystal Lake Ridge */}
          <div className="flex flex-col group">
            <div className="relative overflow-hidden rounded-2xl bg-surface-container-low aspect-video mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Alpine lake"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJgD76eTifmmVKsF6SKPMw5sl_2i-NBS2SYmw1MVN0Ek0JNspDy1hmu6WwFi8BiXHSoUOnbdytJbBTi0ya5yYZqKnvCL27J0iSnXUF8qfFBhhVmTnlDLP51Ku3X96FjFoIJEqp82xY17mK3iUAwH2LXk81xF0UeDp8DxsuxCfj3oteXz-N4RWMsBlIVJpW9--ORcBEbgHDAxRpbizysUp_31kt2qNwAw7MDa_i3YxraxgJg_rEPvjFB213dKRX7dVCWWZloPV2zZN4"
              />
            </div>
            <div className="px-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-black text-primary">Crystal Lake Ridge</h3>
                <span className="text-3xl font-black text-primary">$1.2M</span>
              </div>
              <p className="text-slate-500 text-sm mb-4">Boundary Waters, MN • 12 Acres</p>
              <div className="flex gap-2">
                <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Lakefront</span>
                <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Dense Timber</span>
              </div>
            </div>
          </div>

          {/* Red Rock Plateau */}
          <div className="flex flex-col group">
            <div className="relative overflow-hidden rounded-2xl bg-surface-container-low aspect-video mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Desert mesa"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyf9G08S4V2FIgyV6ti9nSFXGqTOVLsmyHIQnc3htRd4FnzJmkfw70GUKVvqpYTKRed0tJGRZTCxscIC_rkhYQ8l5yxEWkB102mkOdmtcWGnuE9wFMgg13nv295YGLVkBmy6dQU6fWAiD0IoW_rqPWn3DsAzUoSa95_yff57-MtbAzpPEkFrTj-cuYDfKp0H5ivVubg-U5S-O-KVkdO4bsAy3jVR7b6mZdwUlpA4Wy4u7_D8aJn0ZBdwNMuRofdiRpMou6scDkdPQa"
              />
            </div>
            <div className="px-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-black text-primary">Red Rock Plateau</h3>
                <span className="text-3xl font-black text-primary">$340k</span>
              </div>
              <p className="text-slate-500 text-sm mb-4">Sedona Outskirts, AZ • 120 Acres</p>
              <div className="flex gap-2">
                <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Zoned Commercial</span>
              </div>
            </div>
          </div>

          {/* Old Growth Sanctuary */}
          <div className="flex flex-col group">
            <div className="relative overflow-hidden rounded-2xl bg-surface-container-low aspect-video mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Foggy forest"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDD-JzenLAuzwTyCM7r1lUolp3DE8j14_kDPQUYsrUPhcEihB-rfJUzfxvEavG__Ewz8h2zZlExQPGau_aYWRABPj_AvykNIraOyfsnuO2pYdvvd3azQ2I1RkjyxKsfeMdUlkHqB62r_8IwqxiVIc904u82VsxkrNMO7givq8WAaGULWDIGDsNEjlHvaQS8Clev7pxsv-9yRMgffR6A9d5mzxx6EXhPoDiHH9upjQVbaVWpQPoUkHpfWk4b437Jr1UPSANF7oeRayxn"
              />
            </div>
            <div className="px-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-black text-primary">Old Growth Sanctuary</h3>
                <span className="text-3xl font-black text-primary">$2.8M</span>
              </div>
              <p className="text-slate-500 text-sm mb-4">Olympic Peninsula, WA • 215 Acres</p>
              <div className="flex gap-2">
                <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Conservation Easement</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 px-8 bg-primary dark:bg-black grid grid-cols-1 md:grid-cols-2 items-center gap-8 z-10 relative">
        <div className="space-y-6">
          <div className="text-emerald-50 font-black text-2xl tracking-tighter flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="LotScout Logo"
              className="h-10 w-10 object-contain invert brightness-0"
              src="/logo.png"
            />
            LotScout
          </div>
          <p className="font-['Inter'] text-xs tracking-wide uppercase text-emerald-200/60 max-w-sm leading-relaxed">
            Advanced Geospatial Land Management Systems. Precision in every boundary. Engineered for the modern acquisition professional.
          </p>
          <div className="text-emerald-200/40 font-['Inter'] text-[10px] uppercase tracking-widest">
            © 2024 LotScout. All rights reserved.
          </div>
        </div>
        <div className="flex flex-wrap md:justify-end gap-x-10 gap-y-4 font-['Inter'] text-xs tracking-widest uppercase font-bold">
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Terms of Service</a>
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Privacy Policy</a>
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Data Sources</a>
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Contact Support</a>
        </div>
      </footer>

      {/* FAB */}
      <div className="fixed bottom-10 right-10 z-[60]">
        <button className="bg-primary text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform ring-4 ring-white/10">
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            add
          </span>
        </button>
      </div>
    </div>
  );
}
