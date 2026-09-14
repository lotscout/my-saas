const objectionBullets = [
  {
    title: '“I do not know who will actually buy this lot.”',
    body: 'See buyer demand by market, lot type, budget, and acquisition criteria before you waste weeks calling around.',
  },
  {
    title: '“The parcel looks good, but the diligence is messy.”',
    body: 'Review zoning, utilities, buildability, comps, and market signals in one place before you commit time or capital.',
  },
  {
    title: '“I need more than another listing site.”',
    body: 'LotScout connects land opportunities with buyer intent and development intelligence—not just passive inventory.',
  },
];

const marketSignals = [
  'Buyer demand match',
  'Zoning + utility context',
  'Builder-ready insights',
  'Market momentum signals',
];

export default function LandingMockPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ec] text-[#153326]">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between rounded-3xl border border-[#d9d2c3] bg-white/75 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
          <a href="/home" className="flex items-center gap-3" aria-label="LotScout home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lotscout-logo.png" alt="LotScout" className="h-10 w-10 rounded-xl object-contain" />
            <span className="font-headline text-2xl font-black tracking-tight text-[#1b4332]">LotScout</span>
          </a>
          <div className="hidden items-center gap-2 text-sm font-semibold text-[#466456] sm:flex">
            <span className="rounded-full bg-[#e8efe6] px-3 py-1">Land Development Intelligence</span>
          </div>
          <a
            href="/sign-up"
            className="rounded-full bg-[#1b4332] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#143426]"
          >
            Get matched
          </a>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border border-[#c9ddcf] bg-white/80 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.18em] text-[#1d6f50]">
              For land sellers, wholesalers, builders, and developers
            </p>
            <h1 className="font-headline text-5xl font-black leading-[0.95] tracking-[-0.055em] text-[#10291e] sm:text-6xl lg:text-7xl">
              Know who wants the lot before you chase the deal.
            </h1>
            <p className="mt-6 max-w-2xl text-xl font-medium leading-8 text-[#52665b]">
              LotScout helps you validate land opportunities with real buyer intent, buildability context, and market signals—so good parcels do not sit while you guess who to call.
            </p>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
              {marketSignals.map((signal) => (
                <div key={signal} className="flex items-center gap-3 rounded-2xl border border-[#d8dece] bg-white/80 px-4 py-3 text-sm font-bold text-[#244838] shadow-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1b4332] text-xs text-white">✓</span>
                  {signal}
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-[#d9d2c3] bg-white p-4 shadow-2xl shadow-[#1b4332]/10 sm:p-6">
            <div className="rounded-[1.5rem] bg-[#10291e] p-5 text-white sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#a8d4b7]">Live market snapshot</p>
                  <h2 className="mt-2 text-2xl font-black">Austin infill lot</h2>
                </div>
                <span className="rounded-full bg-[#d9f99d] px-3 py-1 text-sm font-black text-[#17330f]">87% fit</span>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>Matched buyers</span>
                    <span>Budget range</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <strong className="text-4xl font-black">24</strong>
                    <strong className="text-xl font-black">$125k–$310k</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white p-4 text-[#143426]">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6f8478]">Zoning</p>
                    <p className="mt-2 text-lg font-black">SF-3</p>
                    <p className="text-xs font-semibold text-[#6f8478]">Builder friendly</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 text-[#143426]">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6f8478]">Demand</p>
                    <p className="mt-2 text-lg font-black">High</p>
                    <p className="text-xs font-semibold text-[#6f8478]">3 active criteria</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#f7f4ec] p-4 text-[#143426]">
                  <p className="text-sm font-black">Best next move</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#52665b]">
                    Prioritize local builders seeking 0.15–0.30 acre infill lots near recent new-build sales.
                  </p>
                </div>
              </div>
            </div>

            <form className="mt-5 rounded-[1.5rem] border border-[#dbe2d6] bg-[#fbfaf6] p-5">
              <h3 className="text-xl font-black text-[#10291e]">Find buyers for your next lot</h3>
              <p className="mt-1 text-sm font-semibold text-[#68796f]">
                Get a quick fit check and see whether LotScout has matching buyer demand.
              </p>
              <div className="mt-4 grid gap-3">
                <input className="rounded-2xl border border-[#d8dece] bg-white px-4 py-3 text-sm font-semibold outline-none ring-[#1b4332]/20 placeholder:text-[#9ba89f] focus:ring-4" placeholder="Property city or market" />
                <input className="rounded-2xl border border-[#d8dece] bg-white px-4 py-3 text-sm font-semibold outline-none ring-[#1b4332]/20 placeholder:text-[#9ba89f] focus:ring-4" placeholder="Lot type or buyer criteria" />
                <input className="rounded-2xl border border-[#d8dece] bg-white px-4 py-3 text-sm font-semibold outline-none ring-[#1b4332]/20 placeholder:text-[#9ba89f] focus:ring-4" placeholder="Email address" type="email" />
                <button className="rounded-2xl bg-[#1b4332] px-5 py-4 text-base font-black text-white shadow-lg shadow-[#1b4332]/20 transition hover:bg-[#143426]" type="button">
                  Show me matched demand
                </button>
              </div>
              <p className="mt-3 text-center text-xs font-semibold text-[#7c8b82]">
                No spam. Just a clearer read on whether the land has a real path to a buyer.
              </p>
            </form>
          </aside>
        </div>

        <section className="grid gap-3 pb-10 lg:grid-cols-3">
          {objectionBullets.map((item) => (
            <div key={item.title} className="rounded-3xl border border-[#d9d2c3] bg-white/80 p-5 shadow-sm">
              <h3 className="text-lg font-black text-[#10291e]">{item.title}</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#607267]">{item.body}</p>
            </div>
          ))}
        </section>

        <footer className="flex flex-col gap-2 border-t border-[#d9d2c3] py-6 text-xs font-semibold text-[#7b897f] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 LotScout. Land Development Intelligence.</p>
          <p>This mock page is for concept review. See terms and privacy before launch.</p>
        </footer>
      </section>
    </main>
  );
}
