export default function MarketplacePage() {
  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-fixed selection:text-primary">
      <nav className="backdrop-blur-xl fixed w-full top-0 z-50 border-b glass-nav bg-white border-slate-200">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-2 text-2xl font-black tracking-tighter font-headline text-primary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="LotScout Logo"
              className="h-8 w-8 inline-block"
              src="https://lh3.googleusercontent.com/aida/ADBb0uhhFEDihaK0gW7nWl1Cof6WZMsDSNbY-od8VJlRtps6kx1SE1ZVjHaH0jtTP7gQw3D6xGEA0jjUiMjSU4cDljSISH6ss-Pc583SH_Z2ow4amEjKpOwoAcm7v2JueaiLHj6khO7U3_e1xd1GlYFveng1qb0D3-aG5ikI2U907SdCjE78r2W3MJn4lEmCChZxpje37vNN349U1BaP1lOThH9NjsizkKh9Pmp8AMwGBWAtielgARDKBOavIYJbtD6IKQUSZMRtKjofNbE"
            />
            LotScout
          </div>
          <div className="hidden md:flex items-center gap-8 font-['Manrope'] tracking-tight font-bold">
            <a className="transition-colors text-slate-600 hover:text-primary" href="#">Marketplace</a>
            <a className="transition-colors text-slate-600 hover:text-primary" href="#">Buyer Directory</a>
            <a className="border-b-2 pb-1 text-primary border-primary" href="#">Deal Analysis</a>
            <a className="transition-colors text-slate-600 hover:text-primary" href="#">Messaging</a>
          </div>
          <div className="flex items-center gap-4">
            <button className="font-bold px-6 py-2 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 text-sm shadow-sm bg-primary text-white">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Create Listing
            </button>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative min-h-[870px] flex flex-col items-center justify-center pt-24 px-6 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[#1B4332] to-[#1B4332]/80 opacity-95"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Topographic landscape background"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaYn2wjOxegWWwjrcTVUFl9gxfyPeUrQatCloSD7gwYRLoszSkj4OXa9LoQe5ZFINW1S60nXMo3B3K9wnmWtMOLOJeg5mR6lmncJVaAfQW2VY-_LdEfWWz2d5xHVtij9Cczu-5Hr9gZkvXZOSePqwoxGnfPOcTtnGi9pydE8tNqF_nceD36s1P6oRWde2b1Ah1OKgZuLhkdesrD6Zr4mP60_siL93t7T840ZwUF9zGELQ2QEXwjk4rSPhmOuO55xh5CjnR6L8omJsk"
            />
          </div>
          <div className="relative z-10 w-full max-w-5xl text-center space-y-12">
            <div className="space-y-6">
              <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-white tracking-tighter max-w-4xl mx-auto leading-tight">
                Run Professional&nbsp;
                <div>
                  <span className="text-on-primary-container">Deal Analysis</span>
                </div>
              </h1>
              <p className="text-emerald-100/80 text-lg md:text-2xl max-w-2xl mx-auto font-light leading-relaxed">
                Get instant comps, land valuations, and risk assessments for any property.
              </p>
            </div>
            <div className="w-full max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-2xl flex items-center gap-2">
                <div className="flex-1 flex items-center px-6">
                  <span className="material-symbols-outlined text-emerald-400 mr-3">location_on</span>
                  <input
                    className="w-full bg-transparent border-none text-white placeholder-emerald-100/50 focus:ring-0 text-lg py-4 font-body"
                    placeholder="Enter property address or parcel ID to begin..."
                    type="text"
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
              <div className="mt-4 flex justify-center gap-6 text-emerald-100/60 text-sm">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span> 150M+ Parcels
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span> Real-time Comps
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span> AI-Risk Scoring
                </span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-surface to-transparent"></div>
        </section>

        <section className="bg-surface py-24 px-8">
          <div className="max-w-screen-2xl mx-auto">
            <div className="flex flex-col md:flex-row gap-12 items-end mb-20">
              <div className="flex-1 space-y-4">
                <span className="text-primary font-bold tracking-widest uppercase text-sm"></span>
                <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-primary tracking-tight">How it works</h2>
              </div>
              <p className="flex-1 text-secondary text-lg leading-relaxed max-w-xl">
                LotScout uses advanced data and mapping technology to quickly analyze land, so you can confidently make smarter buying and selling decisions backed by clear, reliable insights.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="group bg-surface-container-low p-10 rounded-xl transition-all hover:bg-surface-container hover:-translate-y-2 border-l-4 border-primary/10">
                <div className="w-16 h-16 bg-primary text-on-primary rounded-lg flex items-center justify-center mb-8 shadow-inner">
                  <span className="material-symbols-outlined text-3xl">input</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-primary mb-4">1. Input Property</h3>
                <p className="text-secondary leading-relaxed">
                  Search by address, parcel ID, or simply drop a pin on our high-resolution topographic map interface.
                </p>
              </div>
              <div className="group bg-surface-container-low p-10 rounded-xl transition-all hover:bg-surface-container hover:-translate-y-2 border-l-4 border-primary/10">
                <div className="w-16 h-16 bg-primary text-on-primary rounded-lg flex items-center justify-center mb-8 shadow-inner">
                  <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-primary mb-4">2. AI-Powered Comparison</h3>
                <p className="text-secondary leading-relaxed">
                  Our engine instantly scans thousands of recent transactions and environmental data points to calculate true market value.
                </p>
              </div>
              <div className="group bg-surface-container-low p-10 rounded-xl transition-all hover:bg-surface-container hover:-translate-y-2 border-l-4 border-primary/10">
                <div className="w-16 h-16 bg-primary text-on-primary rounded-lg flex items-center justify-center mb-8 shadow-inner">
                  <span className="material-symbols-outlined text-3xl">description</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-primary mb-4">3. Export Comprehensive Report</h3>
                <p className="text-secondary leading-relaxed">
                  Download a detailed PDF report containing zoning insights, risk assessments, and comparable property maps.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-8 bg-surface-container-lowest">
          <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Deal Analysis Dashboard"
                  className="w-full h-auto"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_-TH87zGvth2b20ZkA4KZ4tQvzgnZorz4h_7Io_FFZgix1DdJLDeIdfE_zOGuh_ynswbunGc9bc9xRiN08JfW-_62YoC4WFgNAzyG3hHsetVJa0_D2UFGj6P7uMKAbcasbRrsMsk1Br96JsLQ4UV01-dVHCgFNGdmhRJvC8BaiHYN7dS2jGmHKw-J6ucj0_6eP3XC0RBlkFA53Z8yKejwt6bGHeJOpwi0gtF8L79myVSTDfo-64z2Vqz1g5tYZzXJaWeqDA3iyn0y"
                />
                <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-xl border border-outline-variant/20 flex gap-4 items-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <div>
                    <p className="text-xs text-secondary font-bold uppercase tracking-wider">Analysis Score</p>
                    <p className="text-2xl font-headline font-extrabold text-primary">94.2/100</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-8 order-1 lg:order-2">
              <h2 className="font-headline text-4xl font-extrabold text-primary tracking-tight leading-tight">
                Data Integrity for the Modern Land Investor
              </h2>
              <p className="text-secondary text-lg leading-relaxed">
                We don&apos;t just aggregate data; we curate it. LotScout uses professional-grade satellite imagery
                and local tax records to ensure your analysis is based on the most accurate information available.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary mt-1">check</span>
                  <div>
                    <strong className="text-primary block">Soil &amp; Topography Maps</strong>
                    <p className="text-secondary text-sm">Understand buildability before you step foot on the land.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary mt-1">check</span>
                  <div>
                    <strong className="text-primary block">Zoning &amp; Utility Overlays</strong>
                    <p className="text-secondary text-sm">Instant access to complex municipal zoning codes and utility proximity.</p>
                  </div>
                </li>
              </ul>
              <div className="pt-4">
                <button className="px-8 py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:opacity-95 transition-opacity flex items-center gap-2">
                  Explore Data Sources
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-on-primary w-full py-12">
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
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-white/40 hover:text-white transition-colors cursor-pointer">public</span>
            <span className="material-symbols-outlined text-white/40 hover:text-white transition-colors cursor-pointer">language</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
