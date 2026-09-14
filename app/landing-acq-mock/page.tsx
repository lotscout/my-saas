const stats = [
  ['Nationwide', 'land marketplace'],
  ['24 hr', 'standard report target'],
  ['15 min', 'priority report target'],
  ['Buyer intent', 'plus buildability data'],
];

const resources = [
  {
    eyebrow: 'Free Guide',
    title: 'Land Buyer Demand Checklist',
    body: 'Know what serious builders, developers, and land buyers look for before you package a deal.',
    cta: 'Get the checklist',
  },
  {
    eyebrow: 'Analysis',
    title: 'Lot Fit Report',
    body: 'Review zoning, utilities, market signals, comps, and buyer alignment in one clean readout.',
    cta: 'View reports',
  },
  {
    eyebrow: 'Marketplace',
    title: 'Matched Land Opportunities',
    body: 'Post land or discover acquisition criteria from buyers actively looking for their next lot.',
    cta: 'Explore matches',
  },
];

const faqs = [
  {
    q: 'Who is LotScout for?',
    a: 'Land sellers, wholesalers, realtors, builders, developers, and acquisition teams that need a clearer path between land supply and real buyer demand.',
  },
  {
    q: 'Is this just another listing site?',
    a: 'No. Listings matter, but LotScout is designed around buyer criteria, buildability, market context, and practical land development intelligence.',
  },
  {
    q: 'What do I get after signing up?',
    a: 'Access to marketplace tools, buyer-directory workflows, property analysis, market updates, Scout search, and tier-specific report turnaround.',
  },
  {
    q: 'Do you guarantee a buyer?',
    a: 'No. LotScout improves clarity and matching, but every deal still depends on price, location, diligence, buyer fit, and execution.',
  },
];

export default function AcquisitionStyleLandingMock() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="border-b border-white/10 bg-[#111] px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.14em] text-white/80">
        New: Land Development Intelligence for nationwide land deals
        <a href="/sign-up" className="ml-2 text-[#c8ff63] underline decoration-[#c8ff63]/40 underline-offset-4">
          Find out if LotScout fits your workflow
        </a>
      </div>

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <a href="/home" className="flex items-center gap-3" aria-label="LotScout home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lotscout-logo.png" alt="LotScout" className="h-11 w-11 rounded-xl bg-white object-contain p-1" />
          <span className="font-headline text-2xl font-black tracking-tight">LotScout</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-black uppercase tracking-[0.12em] text-white/70 md:flex">
          <a href="#resources" className="hover:text-white">Resources</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
          <a href="/pricing" className="hover:text-white">Pricing</a>
        </nav>
        <a href="/sign-up" className="rounded-full border border-white bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:bg-[#c8ff63]">
          Start now
        </a>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-24 lg:pt-14">
        <div>
          <p className="mb-5 text-sm font-black uppercase tracking-[0.25em] text-[#c8ff63]">For people who move land</p>
          <h1 className="font-headline text-6xl font-black uppercase leading-[0.88] tracking-[-0.07em] sm:text-7xl lg:text-8xl">
            Do you want to move land faster?
          </h1>
          <p className="mt-7 max-w-2xl text-xl font-semibold leading-8 text-white/68">
            Learn where buyer demand exists, what makes a lot buildable, and how to package land opportunities before they sit untouched for months.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/sign-up" className="rounded-full bg-[#c8ff63] px-7 py-4 text-center text-base font-black uppercase tracking-[0.08em] text-black transition hover:bg-white">
              Get my land roadmap
            </a>
            <a href="/scout" className="rounded-full border border-white/20 px-7 py-4 text-center text-base font-black uppercase tracking-[0.08em] text-white transition hover:border-white hover:bg-white/10">
              Try Scout search
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-[#c8ff63]/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#151515] p-5 shadow-2xl">
            <div className="rounded-[1.5rem] border border-white/10 bg-black p-5">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c8ff63]">Custom Land Roadmap</p>
                  <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em]">Denver builder lot</h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-black">Qualified</span>
              </div>
              <div className="grid gap-3 py-5 sm:grid-cols-2">
                {['Buyer fit: strong', 'Utilities: verify tap', 'Zoning: infill-friendly', 'Exit: builder resale'].map((item) => (
                  <div key={item} className="rounded-2xl bg-white p-4 text-black">
                    <p className="text-sm font-black uppercase tracking-[-0.01em]">{item}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-[#c8ff63] p-5 text-black">
                <p className="text-sm font-black uppercase tracking-[0.16em]">Recommended action</p>
                <p className="mt-2 text-2xl font-black leading-tight tracking-[-0.04em]">
                  Package this around builder demand, recent new-build sales, and utility confirmation before outreach.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white text-black">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-black/10 sm:grid-cols-4">
          {stats.map(([big, small]) => (
            <div key={big} className="bg-white px-5 py-8 text-center">
              <div className="font-headline text-4xl font-black uppercase tracking-[-0.05em] sm:text-5xl">{big}</div>
              <div className="mt-2 text-sm font-black uppercase tracking-[0.12em] text-black/50">{small}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="resources" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mb-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#c8ff63]">Free + practical tools</p>
            <h2 className="mt-3 font-headline text-5xl font-black uppercase leading-none tracking-[-0.06em] sm:text-6xl">Start with clarity.</h2>
          </div>
          <p className="max-w-xl text-lg font-semibold leading-7 text-white/62">
            The page stays simple: one promise, one primary CTA, and resources that justify why someone should give LotScout their attention.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {resources.map((resource) => (
            <article key={resource.title} className="rounded-[1.75rem] border border-white/12 bg-[#141414] p-6 transition hover:-translate-y-1 hover:border-[#c8ff63]/60">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#c8ff63]">{resource.eyebrow}</p>
              <h3 className="mt-4 text-3xl font-black uppercase leading-none tracking-[-0.05em]">{resource.title}</h3>
              <p className="mt-4 min-h-20 text-base font-semibold leading-7 text-white/60">{resource.body}</p>
              <a href="/sign-up" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-black hover:bg-[#c8ff63]">
                {resource.cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="bg-[#f3f1ea] text-black">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:px-10 lg:py-24">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#1b4332]">FAQs</p>
            <h2 className="mt-3 font-headline text-5xl font-black uppercase leading-none tracking-[-0.06em]">Before you scout.</h2>
          </div>
          <div className="divide-y divide-black/15 border-y border-black/15">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-6">
                <h3 className="text-2xl font-black tracking-[-0.04em]">{faq.q}</h3>
                <p className="mt-3 text-base font-semibold leading-7 text-black/62">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="rounded-[2rem] border border-white/12 bg-[#141414] p-8 sm:p-10 lg:p-12">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#c8ff63]">About LotScout</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-end">
            <h2 className="font-headline text-5xl font-black uppercase leading-none tracking-[-0.06em] sm:text-6xl">
              Land deals need better intelligence before they need more listings.
            </h2>
            <div>
              <p className="text-lg font-semibold leading-8 text-white/64">
                LotScout was built from the real bottleneck in land: finding reliable buyers, proving deal quality, and giving both sides enough confidence to move.
              </p>
              <a href="/sign-up" className="mt-6 inline-flex rounded-full bg-[#c8ff63] px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-black hover:bg-white">
                See if LotScout is a fit
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-xs font-semibold leading-6 text-white/42 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p>LotScout does not guarantee buyer interest, sale outcomes, investment returns, zoning approvals, utility availability, or development feasibility. All users should complete independent diligence and consult qualified professionals.</p>
          <p className="mt-4">© 2026 LotScout. Land Development Intelligence.</p>
        </div>
      </footer>
    </main>
  );
}
