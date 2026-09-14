const stats = [
  ['$72M+', 'land transactions'],
  ['$4.32M', 'commission saved at 6%'],
  ['21 days', 'avg. contract-to-close'],
  ['No MLS', 'direct buyer + seller matching'],
];

const resources = [
  {
    eyebrow: 'Buyer Matching',
    title: 'Find the right land buyers',
    body: 'Match lots with active buyer criteria instead of waiting for the MLS to maybe create demand.',
    cta: 'Find buyers',
  },
  {
    eyebrow: 'Seller Access',
    title: 'Surface motivated sellers',
    body: 'Create cleaner conversations between land sellers and buyers who already know what they want.',
    cta: 'View opportunities',
  },
  {
    eyebrow: 'Land Intelligence',
    title: 'Package the deal with proof',
    body: 'Use zoning, utilities, comps, buildability, and market demand to help buyers move with confidence.',
    cta: 'Try Scout',
  },
];

const faqs = [
  {
    q: 'Who is LotScout for?',
    a: 'Land sellers, wholesalers, realtors, builders, developers, and acquisition teams that want to interact with the right buyers and sellers without depending on the MLS to do all the work.',
  },
  {
    q: 'Is this replacing realtors or the MLS?',
    a: 'No. LotScout gives land professionals another channel for buyer/seller matching and diligence. Realtors can use it to price, position, and move land with stronger demand context.',
  },
  {
    q: 'What does “contract-to-close” mean?',
    a: 'It is the average time from getting a land deal under contract to completing the closing process. LotScout is built around shortening that path by improving buyer fit and deal confidence.',
  },
  {
    q: 'Do you guarantee a buyer or sale?',
    a: 'No. LotScout helps create better matches and better diligence, but outcomes still depend on price, location, terms, market demand, and execution.',
  },
];

export default function AcquisitionStyleLandingMock() {
  return (
    <main className="min-h-screen bg-[#f7f4ec] text-[#10291e]">
      <div className="border-b border-[#d9d2c3] bg-[#1b4332] px-4 py-3 text-center text-sm font-black uppercase tracking-[0.14em] text-white">
        $72M+ in land transactions matched outside the traditional MLS path
        <a href="/sign-up" className="ml-2 text-[#d9f99d] underline decoration-[#d9f99d]/50 underline-offset-4">
          See if LotScout fits your workflow
        </a>
      </div>

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <a href="/home" className="flex items-center gap-3" aria-label="LotScout home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lotscout-logo.png" alt="LotScout" className="h-11 w-11 rounded-xl bg-white object-contain p-1 shadow-sm" />
          <span className="font-headline text-2xl font-black tracking-tight text-[#1b4332]">LotScout</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-black uppercase tracking-[0.12em] text-[#52665b] md:flex">
          <a href="#resources" className="hover:text-[#1b4332]">How it works</a>
          <a href="#faq" className="hover:text-[#1b4332]">FAQ</a>
          <a href="/pricing" className="hover:text-[#1b4332]">Pricing</a>
        </nav>
        <a href="/sign-up" className="rounded-full border border-[#1b4332] bg-[#1b4332] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#143426]">
          Start now
        </a>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-24 lg:pt-14">
        <div>
          <p className="mb-5 text-sm font-black uppercase tracking-[0.25em] text-[#1D9E75]">Land Development Intelligence</p>
          <h1 className="font-headline text-6xl font-black uppercase leading-[0.88] tracking-[-0.07em] text-[#10291e] sm:text-7xl lg:text-8xl">
            Move land without waiting on the MLS.
          </h1>
          <p className="mt-7 max-w-2xl text-xl font-semibold leading-8 text-[#52665b]">
            LotScout connects the right buyers and sellers directly, then backs each opportunity with the buyer intent, buildability context, and market data needed to move faster.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/sign-up" className="rounded-full bg-[#1b4332] px-7 py-4 text-center text-base font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#143426]">
              Get matched
            </a>
            <a href="/scout" className="rounded-full border border-[#1b4332]/25 bg-white/70 px-7 py-4 text-center text-base font-black uppercase tracking-[0.08em] text-[#1b4332] transition hover:border-[#1b4332] hover:bg-white">
              Try Scout search
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-[#86af99]/30 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-[#d9d2c3] bg-white p-5 shadow-2xl shadow-[#1b4332]/12">
            <div className="rounded-[1.5rem] border border-[#dbe2d6] bg-[#10291e] p-5 text-white">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a8d4b7]">Direct Buyer Match</p>
                  <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em]">Builder-ready infill lot</h2>
                </div>
                <span className="rounded-full bg-[#d9f99d] px-3 py-1 text-sm font-black text-[#17330f]">Matched</span>
              </div>
              <div className="grid gap-3 py-5 sm:grid-cols-2">
                {['24 qualified buyers', 'No MLS dependency', '21-day close target', '6% commission avoided'].map((item) => (
                  <div key={item} className="rounded-2xl bg-white p-4 text-[#10291e]">
                    <p className="text-sm font-black uppercase tracking-[-0.01em]">{item}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-[#d9f99d] p-5 text-[#10291e]">
                <p className="text-sm font-black uppercase tracking-[0.16em]">Recommended action</p>
                <p className="mt-2 text-2xl font-black leading-tight tracking-[-0.04em]">
                  Match this lot to builders already buying similar parcels, then package the diligence before outreach.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#d9d2c3] bg-white text-[#10291e]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-[#d9d2c3] sm:grid-cols-4">
          {stats.map(([big, small]) => (
            <div key={big} className="bg-white px-5 py-8 text-center">
              <div className="font-headline text-4xl font-black uppercase tracking-[-0.05em] text-[#1b4332] sm:text-5xl">{big}</div>
              <div className="mt-2 text-sm font-black uppercase tracking-[0.12em] text-[#52665b]">{small}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="resources" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mb-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#1D9E75]">The smarter land channel</p>
            <h2 className="mt-3 font-headline text-5xl font-black uppercase leading-none tracking-[-0.06em] text-[#10291e] sm:text-6xl">Start with the match.</h2>
          </div>
          <p className="max-w-xl text-lg font-semibold leading-7 text-[#52665b]">
            The MLS can expose a property. LotScout is built to help you identify who should care, why they should care, and what proof they need to move.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {resources.map((resource) => (
            <article key={resource.title} className="rounded-[1.75rem] border border-[#d9d2c3] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#86af99] hover:shadow-xl hover:shadow-[#1b4332]/10">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#1D9E75]">{resource.eyebrow}</p>
              <h3 className="mt-4 text-3xl font-black uppercase leading-none tracking-[-0.05em] text-[#10291e]">{resource.title}</h3>
              <p className="mt-4 min-h-20 text-base font-semibold leading-7 text-[#607267]">{resource.body}</p>
              <a href="/sign-up" className="mt-6 inline-flex rounded-full bg-[#1b4332] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white hover:bg-[#143426]">
                {resource.cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="bg-[#e8efe6] text-[#10291e]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:px-10 lg:py-24">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#1D9E75]">FAQs</p>
            <h2 className="mt-3 font-headline text-5xl font-black uppercase leading-none tracking-[-0.06em]">Before you scout.</h2>
          </div>
          <div className="divide-y divide-[#1b4332]/15 border-y border-[#1b4332]/15">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-6">
                <h3 className="text-2xl font-black tracking-[-0.04em]">{faq.q}</h3>
                <p className="mt-3 text-base font-semibold leading-7 text-[#52665b]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="rounded-[2rem] border border-[#d9d2c3] bg-[#1b4332] p-8 text-white shadow-2xl shadow-[#1b4332]/15 sm:p-10 lg:p-12">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#d9f99d]">About LotScout</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-end">
            <h2 className="font-headline text-5xl font-black uppercase leading-none tracking-[-0.06em] sm:text-6xl">
              Land deals need better buyer access before they need more listing exposure.
            </h2>
            <div>
              <p className="text-lg font-semibold leading-8 text-white/72">
                LotScout was built from the real bottleneck in land: finding reliable buyers and sellers, proving deal quality, and creating enough confidence to move without waiting months for MLS attention.
              </p>
              <a href="/sign-up" className="mt-6 inline-flex rounded-full bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#1b4332] hover:bg-[#d9f99d]">
                See if LotScout is a fit
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d9d2c3] px-5 py-8 text-xs font-semibold leading-6 text-[#7b897f] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p>LotScout does not guarantee buyer interest, sale outcomes, investment returns, zoning approvals, utility availability, or development feasibility. Transaction, commission, and timeline figures are historical/contextual and not a guarantee of future results. All users should complete independent diligence and consult qualified professionals.</p>
          <p className="mt-4">© 2026 LotScout. Land Development Intelligence.</p>
        </div>
      </footer>
    </main>
  );
}
