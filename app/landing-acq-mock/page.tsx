const stats = [
  ['$72M+', 'land transactions'],
  ['$4.32M', 'commission saved at 6%'],
  ['21 days', 'avg. contract-to-close'],
  ['2-sided', 'buyer + seller matching'],
];

const roles = ['Seller', 'Buyer', 'Builder', 'Developer', 'Realtor', 'Wholesaler'];

const objections = [
  {
    title: '“I need the right buyer, not more tire-kickers.”',
    body: 'For sellers and wholesalers, LotScout helps identify buyers whose criteria actually match the lot, market, budget, and development path.',
  },
  {
    title: '“I need real land opportunities, not stale listings.”',
    body: 'For buyers, builders, and developers, LotScout helps surface seller-side opportunities and deal context before everything depends on public MLS exposure.',
  },
  {
    title: '“Both sides need confidence before they move.”',
    body: 'LotScout packages buyer intent, seller context, zoning, utilities, comps, buildability, and market demand so conversations start with proof instead of guesswork.',
  },
];

const steps = [
  ['1', 'Tell us your market', 'Share where you buy, sell, build, develop, or source land and what kind of opportunities matter to you.'],
  ['2', 'We identify both sides of the fit', 'LotScout compares buyer criteria, seller opportunities, property fundamentals, and market context.'],
  ['3', 'Start the right conversation', 'Use better matches and cleaner diligence to create faster, more qualified buyer/seller conversations.'],
];

const faqs = [
  {
    q: 'Who is LotScout for?',
    a: 'Land sellers, buyers, wholesalers, realtors, builders, developers, and acquisition teams that want to interact with the right side of the deal without depending on the MLS to do all the work.',
  },
  {
    q: 'Is this replacing realtors or the MLS?',
    a: 'No. LotScout gives land professionals another channel for two-sided buyer/seller matching and diligence. Realtors can use it to price, position, and move land with stronger demand context.',
  },
  {
    q: 'What does “contract-to-close” mean?',
    a: 'It is the average time from getting a land deal under contract to completing the closing process. LotScout is built around shortening that path by improving buyer/seller fit and deal confidence.',
  },
];

export default function AcquisitionStyleLandingMock() {
  return (
    <main className="min-h-screen scroll-smooth bg-white text-[#10291e] lg:h-svh lg:overflow-y-auto lg:snap-y lg:snap-proximity">
      <div className="lg:snap-start border-b border-[#d9d2c3] bg-[#1b4332] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.1em] text-white sm:text-sm sm:tracking-[0.12em]">
        $72M+ in land transactions connected through direct buyer/seller relationships
      </div>

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10 lg:py-5">
        <a href="/home" className="flex items-center gap-3" aria-label="LotScout home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lotscout-logo.png" alt="LotScout" className="h-11 w-11 object-contain" />
          <span className="font-headline text-2xl font-black tracking-tight text-[#1b4332]">LotScout</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-black uppercase tracking-[0.12em] text-[#52665b] md:flex">
          <a href="#proof" className="hover:text-[#1b4332]">Proof</a>
          <a href="#how" className="hover:text-[#1b4332]">How it works</a>
          <a href="#faq" className="hover:text-[#1b4332]">FAQ</a>
        </nav>
        <a href="#match-form-mobile" className="rounded-full border border-[#1b4332] bg-[#1b4332] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#143426] lg:hidden">
          Get matched
        </a>
        <a href="#match-form-desktop" className="hidden rounded-full border border-[#1b4332] bg-[#1b4332] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#143426] lg:inline-flex">
          Get matched
        </a>
      </header>

      <section className="mx-auto grid max-w-7xl items-start gap-5 px-5 pb-5 pt-6 sm:px-8 lg:min-h-[calc(100svh-108px)] lg:snap-start lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-12 lg:px-10 lg:py-6">
        <div className="lg:self-center">
          <h1 className="font-headline text-[2.65rem] font-black uppercase leading-[0.9] tracking-[-0.06em] text-[#10291e] sm:text-5xl lg:text-5xl xl:text-6xl">
            Need the right land match without waiting on the MLS?
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-6 text-[#52665b] sm:mt-7 sm:text-xl sm:leading-8">
            LotScout helps land buyers and sellers find each other faster, then adds the diligence, buyer intent, seller context, and market data needed to move with confidence.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.08em] text-[#1b4332] sm:mt-7 sm:gap-3 sm:text-sm">
            <span className="rounded-full border border-[#1b4332]/15 bg-[#f7f4ec] px-4 py-2 shadow-sm">Verified buyers and sellers</span>
            <span className="rounded-full border border-[#1b4332]/15 bg-[#f7f4ec] px-4 py-2 shadow-sm">Marketplace with 500+ off-market properties</span>
            <span className="rounded-full border border-[#1b4332]/15 bg-[#f7f4ec] px-4 py-2 shadow-sm">No MLS access required</span>
            <span className="rounded-full border border-[#1b4332]/15 bg-[#f7f4ec] px-4 py-2 shadow-sm">Build relationships with the right people</span>
          </div>
        </div>

        <aside id="match-form-desktop" className="relative hidden w-full max-w-lg scroll-mt-6 justify-self-center lg:block lg:-translate-y-12 lg:self-center">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-[#86af99]/30 blur-3xl" />
          <div className="relative rounded-[1.5rem] border border-[#d9d2c3] bg-[#f7f4ec] p-4 shadow-2xl shadow-[#1b4332]/12 sm:rounded-[2rem] lg:p-4">
            <div className="mb-3 rounded-[1.25rem] bg-[#10291e] p-3.5 text-white sm:rounded-[1.4rem] lg:p-4">
              <h2 className="mt-1 text-2xl font-black uppercase leading-none tracking-[-0.05em] sm:text-2xl">Find your next land deal.</h2>
              <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
                Tell us whether you are buying, selling, sourcing, or building. We will route you toward the right buyer, seller, or land intelligence workflow.
              </p>
            </div>

            <form className="grid gap-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="sr-only" htmlFor="name">Name</label>
                <input id="name" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4 lg:py-1.5" placeholder="Name" />
                <label className="sr-only" htmlFor="email">Email</label>
                <input id="email" type="email" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4 lg:py-1.5" placeholder="Email" />
              </div>
              <label className="sr-only" htmlFor="market">Market or state</label>
              <input id="market" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4 lg:py-1.5" placeholder="Market or state" />
              <label className="sr-only" htmlFor="goal">What side of the land deal are you on?</label>
              <select id="goal" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold text-[#52665b] outline-none ring-[#1b4332]/20 focus:ring-4 lg:py-1.5">
                <option>What side of the land deal are you on?</option>
                <option>I have land and need buyers</option>
                <option>I am buying land</option>
                <option>I need seller opportunities</option>
                <option>I want to analyze a lot</option>
                <option>I want to build a buyer or seller pipeline</option>
              </select>
              <div>
                <p className="mb-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#607267]">I am a</p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {roles.map((role) => (
                    <label key={role} className="flex cursor-pointer items-center gap-2 rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-3 py-1 text-xs font-black text-[#1b4332]">
                      <input type="radio" name="role" className="accent-[#1b4332]" />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
              <button type="button" className="mt-1 rounded-2xl bg-[#1b4332] px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-[#1b4332]/20 transition hover:bg-[#143426]">
                Find my land match
              </button>
              <p className="text-center text-[11px] font-bold leading-4 text-[#7c8b82]">
                No credit card required to get started.
              </p>
            </form>
          </div>
        </aside>
      </section>

      <section id="match-form-mobile" className="mx-auto flex max-w-2xl scroll-mt-4 flex-col justify-center px-5 pb-10 pt-1 sm:px-8 lg:hidden">
        <div className="relative rounded-[1.5rem] border border-[#d9d2c3] bg-[#f7f4ec] p-4 shadow-2xl shadow-[#1b4332]/12">
          <div className="mb-4 rounded-[1.25rem] bg-[#10291e] p-4 text-white">
            <h2 className="text-2xl font-black uppercase leading-none tracking-[-0.05em]">Find your next land deal.</h2>
            <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
              Tell us whether you are buying, selling, sourcing, or building. We will route you toward the right buyer, seller, or land intelligence workflow.
            </p>
          </div>
          <form className="grid gap-2.5">
            <label className="sr-only" htmlFor="name-mobile">Name</label>
            <input id="name-mobile" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4 lg:py-1.5" placeholder="Name" />
            <label className="sr-only" htmlFor="email-mobile">Email</label>
            <input id="email-mobile" type="email" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4 lg:py-1.5" placeholder="Email" />
            <label className="sr-only" htmlFor="market-mobile">Market or state</label>
            <input id="market-mobile" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4 lg:py-1.5" placeholder="Market or state" />
            <label className="sr-only" htmlFor="goal-mobile">What side of the land deal are you on?</label>
            <select id="goal-mobile" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-2.5 text-sm font-bold text-[#52665b] outline-none ring-[#1b4332]/20 focus:ring-4">
              <option>What side of the land deal are you on?</option>
              <option>I have land and need buyers</option>
              <option>I am buying land</option>
              <option>I need seller opportunities</option>
              <option>I want to analyze a lot</option>
              <option>I want to build a buyer or seller pipeline</option>
            </select>
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#607267]">I am a</p>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <label key={role} className="flex cursor-pointer items-center gap-2 rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-3 py-1.5 text-sm font-black text-[#1b4332]">
                    <input type="radio" name="role-mobile" className="accent-[#1b4332]" />
                    {role}
                  </label>
                ))}
              </div>
            </div>
            <button type="button" className="mt-1 rounded-2xl bg-[#1b4332] px-6 py-3.5 text-base font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-[#1b4332]/20 transition hover:bg-[#143426]">
              Find my land match
            </button>
            <p className="text-center text-xs font-bold leading-5 text-[#7c8b82]">
              No credit card required to get started.
            </p>
          </form>
        </div>
      </section>

      <section id="proof" className="flex border-y border-[#d9d2c3] lg:min-h-svh lg:snap-start lg:items-center bg-white text-[#10291e]">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-px bg-[#d9d2c3] sm:grid-cols-4">
          {stats.map(([big, small]) => (
            <div key={big} className="bg-white px-4 py-7 text-center shadow-sm ring-1 ring-[#d9d2c3]/70 sm:px-5 sm:py-10">
              <div className="font-headline text-3xl font-black uppercase tracking-[-0.05em] text-[#1b4332] sm:text-5xl">{big}</div>
              <div className="mt-2 text-sm font-black uppercase tracking-[0.12em] text-[#52665b]">{small}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col justify-center px-5 py-10 sm:px-8 lg:min-h-svh lg:snap-start lg:px-10 lg:py-12">
        <div className="mb-6 max-w-3xl sm:mb-10">
          <h2 className="mt-3 font-headline text-4xl font-black uppercase leading-none tracking-[-0.06em] text-[#10291e] sm:text-6xl">Answer the real objections.</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {objections.map((item) => (
            <article key={item.title} className="rounded-[1.5rem] border border-[#d9d2c3] bg-[#f7f4ec] p-5 shadow-sm sm:rounded-[1.75rem] sm:p-6">
              <h3 className="text-xl font-black leading-tight tracking-[-0.04em] text-[#10291e] sm:text-2xl">{item.title}</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#607267] sm:mt-4 sm:text-base sm:leading-7">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="flex bg-[#e8efe6] text-[#10291e] lg:min-h-svh lg:snap-start lg:items-center">
        <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
          <div className="mb-10 max-w-3xl">
            <h2 className="mt-3 font-headline text-4xl font-black uppercase leading-none tracking-[-0.06em] sm:text-6xl">Start with the match.</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {steps.map(([num, title, body]) => (
              <div key={num} className="rounded-[1.5rem] border border-[#1b4332]/15 bg-white p-5 shadow-sm sm:rounded-[1.75rem] sm:p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1b4332] text-lg font-black text-white">{num}</span>
                <h3 className="mt-4 text-xl font-black tracking-[-0.04em] sm:mt-5 sm:text-2xl">{title}</h3>
                <p className="mt-3 text-base font-semibold leading-7 text-[#52665b]">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a href="#match-form-mobile" className="inline-flex rounded-full bg-[#1b4332] px-7 py-4 text-base font-black uppercase tracking-[0.08em] text-white hover:bg-[#143426] lg:hidden">
              Find my land match
            </a>
            <a href="#match-form-desktop" className="hidden rounded-full bg-[#1b4332] px-7 py-4 text-base font-black uppercase tracking-[0.08em] text-white hover:bg-[#143426] lg:inline-flex">
              Find my land match
            </a>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:min-h-svh lg:snap-start lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:px-10 lg:py-12">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#1D9E75]">FAQs</p>
          <h2 className="mt-3 font-headline text-4xl font-black uppercase leading-none tracking-[-0.06em] sm:text-6xl">Before you scout.</h2>
        </div>
        <div className="divide-y divide-[#1b4332]/15 border-y border-[#1b4332]/15">
          {faqs.map((faq) => (
            <div key={faq.q} className="py-4 sm:py-6">
              <h3 className="text-2xl font-black tracking-[-0.04em]">{faq.q}</h3>
              <p className="mt-3 text-base font-semibold leading-7 text-[#52665b]">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl items-center px-5 py-10 sm:px-8 lg:min-h-svh lg:snap-start lg:px-10 lg:py-12">
        <div className="w-full rounded-[2rem] border border-[#d9d2c3] bg-[#1b4332] p-8 text-center text-white shadow-2xl shadow-[#1b4332]/15 sm:p-10 lg:p-12">
          <h2 className="mx-auto mt-4 max-w-4xl font-headline text-4xl font-black uppercase leading-none tracking-[-0.06em] sm:text-6xl">
            Land deals need better matching before they need more listing exposure.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/72">
            LotScout was built around the real bottleneck in land: helping the right buyers and sellers find each other, proving deal quality, and creating enough confidence to move.
          </p>
          <a href="#match-form-mobile" className="mt-7 inline-flex rounded-full bg-white px-7 py-4 text-base font-black uppercase tracking-[0.08em] text-[#1b4332] hover:bg-[#d9f99d] lg:hidden">
            Get matched
          </a>
          <a href="#match-form-desktop" className="mt-7 hidden rounded-full bg-white px-7 py-4 text-base font-black uppercase tracking-[0.08em] text-[#1b4332] hover:bg-[#d9f99d] lg:inline-flex">
            Get matched
          </a>
        </div>
      </section>

      <footer className="lg:snap-start border-t border-[#d9d2c3] px-5 py-8 text-xs font-semibold leading-6 text-[#7b897f] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p>LotScout does not guarantee buyer interest, sale outcomes, investment returns, zoning approvals, utility availability, or development feasibility. Transaction, commission, and timeline figures are historical/contextual and not a guarantee of future results. All users should complete independent diligence and consult qualified professionals.</p>
          <p className="mt-4">© 2026 LotScout.</p>
        </div>
      </footer>
    </main>
  );
}
