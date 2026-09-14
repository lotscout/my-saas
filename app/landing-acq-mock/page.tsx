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
    q: 'Why not send people straight to pricing?',
    a: 'Because most land professionals need to see the match potential before a subscription makes sense. This page is designed to capture qualified intent first, then move users into signup and pricing once the value is clearer.',
  },
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
    <main className="min-h-screen bg-[#f7f4ec] text-[#10291e]">
      <div className="border-b border-[#d9d2c3] bg-[#1b4332] px-4 py-3 text-center text-sm font-black uppercase tracking-[0.12em] text-white">
        $72M+ in land transactions connected through direct buyer/seller relationships
      </div>

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <a href="/home" className="flex items-center gap-3" aria-label="LotScout home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lotscout-logo.png" alt="LotScout" className="h-11 w-11 rounded-xl bg-white object-contain p-1 shadow-sm" />
          <span className="font-headline text-2xl font-black tracking-tight text-[#1b4332]">LotScout</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-black uppercase tracking-[0.12em] text-[#52665b] md:flex">
          <a href="#proof" className="hover:text-[#1b4332]">Proof</a>
          <a href="#how" className="hover:text-[#1b4332]">How it works</a>
          <a href="#faq" className="hover:text-[#1b4332]">FAQ</a>
        </nav>
        <a href="#match-form" className="rounded-full border border-[#1b4332] bg-[#1b4332] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#143426]">
          Get matched
        </a>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:pb-20 lg:pt-12">
        <div>
          <p className="mb-5 text-sm font-black uppercase tracking-[0.25em] text-[#1D9E75]">Land Development Intelligence</p>
          <h1 className="font-headline text-5xl font-black uppercase leading-[0.9] tracking-[-0.065em] text-[#10291e] sm:text-7xl lg:text-8xl">
            Find the right land match without waiting on the MLS.
          </h1>
          <p className="mt-7 max-w-2xl text-xl font-semibold leading-8 text-[#52665b]">
            LotScout helps land buyers and sellers find each other faster,then adds the diligence, buyer intent, seller context, and market data needed to move with confidence.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm font-black uppercase tracking-[0.08em] text-[#1b4332]">
            <span className="rounded-full border border-[#1b4332]/15 bg-white px-4 py-2">Buy-side + sell-side matching</span>
            <span className="rounded-full border border-[#1b4332]/15 bg-white px-4 py-2">No payment to start</span>
            <span className="rounded-full border border-[#1b4332]/15 bg-white px-4 py-2">Works beyond the MLS</span>
          </div>
        </div>

        <aside id="match-form" className="relative scroll-mt-6">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-[#86af99]/30 blur-3xl" />
          <div className="relative rounded-[2rem] border border-[#d9d2c3] bg-white p-5 shadow-2xl shadow-[#1b4332]/12 sm:p-6">
            <div className="mb-5 rounded-[1.4rem] bg-[#10291e] p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a8d4b7]">Free match request</p>
              <h2 className="mt-2 text-3xl font-black uppercase leading-none tracking-[-0.05em]">Find your next land match.</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/70">
                Tell us whether you are buying, selling, sourcing, or building. We will route you toward the right buyer, seller, or land intelligence workflow.
              </p>
            </div>

            <form className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="sr-only" htmlFor="name">Name</label>
                <input id="name" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-3 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4" placeholder="Name" />
                <label className="sr-only" htmlFor="email">Email</label>
                <input id="email" type="email" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-3 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4" placeholder="Email" />
              </div>
              <label className="sr-only" htmlFor="market">Market or state</label>
              <input id="market" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-3 text-sm font-bold outline-none ring-[#1b4332]/20 placeholder:text-[#8a9a90] focus:ring-4" placeholder="Market or state" />
              <label className="sr-only" htmlFor="goal">What side of the land deal are you on?</label>
              <select id="goal" className="rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-4 py-3 text-sm font-bold text-[#52665b] outline-none ring-[#1b4332]/20 focus:ring-4">
                <option>What side of the land deal are you on?</option>
                <option>I have land and need buyers</option>
                <option>I am buying land</option>
                <option>I need seller opportunities</option>
                <option>I want to analyze a lot</option>
                <option>I want to build a buyer or seller pipeline</option>
              </select>
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#607267]">I am a</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {roles.map((role) => (
                    <label key={role} className="flex cursor-pointer items-center gap-2 rounded-2xl border border-[#d8dece] bg-[#fbfaf6] px-3 py-2 text-sm font-black text-[#1b4332]">
                      <input type="radio" name="role" className="accent-[#1b4332]" />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
              <button type="button" className="mt-2 rounded-2xl bg-[#1b4332] px-6 py-4 text-base font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-[#1b4332]/20 transition hover:bg-[#143426]">
                Find my land match
              </button>
              <p className="text-center text-xs font-bold leading-5 text-[#7c8b82]">
                Free to start. No credit card required. Pricing comes after we understand your land workflow.
              </p>
            </form>
          </div>
        </aside>
      </section>

      <section id="proof" className="border-y border-[#d9d2c3] bg-white text-[#10291e]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-[#d9d2c3] sm:grid-cols-4">
          {stats.map(([big, small]) => (
            <div key={big} className="bg-white px-5 py-8 text-center">
              <div className="font-headline text-4xl font-black uppercase tracking-[-0.05em] text-[#1b4332] sm:text-5xl">{big}</div>
              <div className="mt-2 text-sm font-black uppercase tracking-[0.12em] text-[#52665b]">{small}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mb-10 max-w-3xl">
          <h2 className="mt-3 font-headline text-5xl font-black uppercase leading-none tracking-[-0.06em] text-[#10291e] sm:text-6xl">Answer the real objections.</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {objections.map((item) => (
            <article key={item.title} className="rounded-[1.75rem] border border-[#d9d2c3] bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-black leading-tight tracking-[-0.04em] text-[#10291e]">{item.title}</h3>
              <p className="mt-4 text-base font-semibold leading-7 text-[#607267]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="bg-[#e8efe6] text-[#10291e]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="mb-10 max-w-3xl">
            <h2 className="mt-3 font-headline text-5xl font-black uppercase leading-none tracking-[-0.06em]">Start with the match.</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {steps.map(([num, title, body]) => (
              <div key={num} className="rounded-[1.75rem] border border-[#1b4332]/15 bg-white/80 p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1b4332] text-lg font-black text-white">{num}</span>
                <h3 className="mt-5 text-2xl font-black tracking-[-0.04em]">{title}</h3>
                <p className="mt-3 text-base font-semibold leading-7 text-[#52665b]">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a href="#match-form" className="inline-flex rounded-full bg-[#1b4332] px-7 py-4 text-base font-black uppercase tracking-[0.08em] text-white hover:bg-[#143426]">
              Find my land match
            </a>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:px-10 lg:py-20">
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
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10 lg:pb-24">
        <div className="rounded-[2rem] border border-[#d9d2c3] bg-[#1b4332] p-8 text-center text-white shadow-2xl shadow-[#1b4332]/15 sm:p-10 lg:p-12">
          <h2 className="mx-auto mt-4 max-w-4xl font-headline text-4xl font-black uppercase leading-none tracking-[-0.06em] sm:text-6xl">
            Land deals need better matching before they need more listing exposure.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/72">
            LotScout was built around the real bottleneck in land: helping the right buyers and sellers find each other, proving deal quality, and creating enough confidence to move.
          </p>
          <a href="#match-form" className="mt-7 inline-flex rounded-full bg-white px-7 py-4 text-base font-black uppercase tracking-[0.08em] text-[#1b4332] hover:bg-[#d9f99d]">
            Get matched
          </a>
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
