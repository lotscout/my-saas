import Header from '@/components/Header';

const STATS = [
  { label: 'U.S. Avg Farmland', value: '$4,350', unit: '/acre', note: '+4.3% from 2024 · USDA' },
  { label: 'Prime Cropland Avg', value: '$5,830', unit: '/acre', note: '+2.2% inflation-adjusted' },
  { label: 'Pastureland Avg', value: '$1,920', unit: '/acre', note: '+2.4% inflation-adjusted' },
  { label: '5-Year CAGR', value: '5.8%', unit: '', note: 'All land types nationally' },
];

const TOP_STATES = [
  {
    rank: 1,
    state: 'Texas',
    price: '$2,970/acre avg',
    insight:
      'Central Texas showing 8.3% annual appreciation since 2020 driven by tech industry expansion. Hill Country and suburban corridors remain the most active markets.',
  },
  {
    rank: 2,
    state: 'Iowa',
    price: '$9,000–$13,000/acre (prime cropland)',
    insight:
      'April auction data shows 4,420+ acres sold in a single month. Sioux County led with top sales reaching $26,600/acre on high-quality farmland.',
  },
  {
    rank: 3,
    state: 'Colorado',
    price: '$2,290/acre avg',
    insight:
      'Front Range development pressure pushing rural land values upward. Recreational and mountain parcels near ski corridors seeing strong demand.',
  },
  {
    rank: 4,
    state: 'Idaho',
    price: '$4,180/acre avg',
    insight:
      'Rapid population growth and outdoor lifestyle demand driving appreciation. Snake River Plain agricultural land and mountain recreational parcels both active.',
  },
  {
    rank: 5,
    state: 'Tennessee',
    price: '$15,000–$35,000/acre (Smoky Mountain region)',
    insight:
      'No state income tax advantage attracting buyers. Ridge-top parcels with views commanding $50,000+/acre premium.',
  },
];

const INSIGHTS = [
  {
    icon: 'landscape',
    title: 'Recreational Land Leads Demand',
    body: 'Recreational land remains the most competitive segment. Buyers prioritizing lifestyle, privacy, and long-term enjoyment over short-term appreciation. Properties with live water, hunting access, and scenic views setting record prices. Water features remain critical value drivers.',
  },
  {
    icon: 'account_balance',
    title: 'Multi-Use Properties Command Premium',
    body: 'Properties supporting agricultural, recreational, and residential uses simultaneously are the strongest performers. Buyers increasingly value optionality: land that generates income today while preserving future development potential. Parcels with favorable zoning and subdivision potential receiving stronger offers.',
  },
  {
    icon: 'trending_flat',
    title: 'Tariff Impact and Agricultural Stabilization',
    body: 'Corn and soybean prices stabilized following ad-hoc government payments offsetting tariff impact. Congress strengthened crop insurance programs. Benchmark farm values at $8,299/acre, down modestly from peak but stable outlook through mid-2026. Cattle operators managing volatility but supply-demand fundamentals remain supportive.',
  },
];

export default function AprilMarketReport() {
  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-body">
      <Header />

      <main className="flex-grow pt-24 pb-20 px-6 max-w-5xl mx-auto w-full">

        {/* ── Report header ── */}
        <header className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-3">LotScout Market Report</p>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight mb-3">
            April 2026<br />
            <span className="text-emerald-600">U.S. Land Market</span> Analysis
          </h1>
          <p className="text-secondary font-medium text-sm mb-6">Published May 2026 · LotScout Research</p>
          <div className="h-px bg-gradient-to-r from-emerald-600 via-emerald-300 to-transparent" />
        </header>

        {/* ── Section 1: National Overview ── */}
        <section className="mb-14">
          <h2 className="font-headline text-2xl font-extrabold text-primary mb-2">National Overview</h2>
          <p className="text-secondary text-sm mb-8 max-w-2xl">
            U.S. land markets entered 2026 with cautious optimism, values stabilizing after the post-pandemic peak, while quality parcels continue to command premium prices across all regions.
          </p>

          {/* Stat callout cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {STATS.map(s => (
              <div key={s.label} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">{s.label}</p>
                <p className="font-headline text-3xl font-extrabold text-primary leading-none">
                  {s.value}<span className="text-lg font-bold text-emerald-700">{s.unit}</span>
                </p>
                <p className="text-[11px] text-secondary/80 mt-1">{s.note}</p>
              </div>
            ))}
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-6 flex items-start gap-4">
            <span className="material-symbols-outlined text-emerald-600 text-2xl shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            <div>
              <p className="font-semibold text-on-surface text-sm mb-1">Market Sentiment: Cautious Optimism</p>
              <p className="text-secondary text-sm leading-relaxed">
                The national average price range across all land types sits at <strong className="text-on-surface">$12,000–$15,000/acre</strong>, with a 5-year compound annual growth rate of <strong className="text-on-surface">5.8%</strong>. Values are stabilizing after the 2021–2023 peak, but demand for quality parcels remains firm, especially in high-growth states and recreational markets.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 2: Top 5 States ── */}
        <section className="mb-14">
          <h2 className="font-headline text-2xl font-extrabold text-primary mb-2">Top 5 States to Watch</h2>
          <p className="text-secondary text-sm mb-8 max-w-2xl">
            These markets are showing the strongest activity, appreciation, and buyer demand heading into mid-2026.
          </p>

          <div className="space-y-4">
            {TOP_STATES.map(({ rank, state, price, insight }) => (
              <div key={rank} className="flex items-start gap-5 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-6 hover:border-emerald-200 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white font-extrabold text-sm font-headline">{rank}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-3 mb-1">
                    <h3 className="font-headline text-lg font-extrabold text-primary">{state}</h3>
                    <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">{price}</span>
                  </div>
                  <p className="text-secondary text-sm leading-relaxed">{insight}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Notable Market Shifts ── */}
        <section className="mb-14">
          <h2 className="font-headline text-2xl font-extrabold text-primary mb-2">Notable Market Shifts</h2>
          <p className="text-secondary text-sm mb-8 max-w-2xl">
            Three structural trends shaping buyer and seller behavior across U.S. land markets in spring 2026.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {INSIGHTS.map(({ icon, title, body }) => (
              <div key={title} className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-6 flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-700 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-on-surface text-base mb-2">{title}</h3>
                  <p className="text-secondary text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent mb-10" />

        {/* ── Report footer ── */}
        <footer className="text-center">
          <p className="text-xs text-secondary/60 italic leading-relaxed max-w-2xl mx-auto mb-4">
            Data sourced from USDA Economic Research Service, FCSAmerica Farmland Values Report, and public auction records. This report is for informational purposes only and does not constitute investment advice.
          </p>
          <p className="text-xs text-secondary/50">© 2026 LotScout. All rights reserved.</p>
        </footer>

      </main>
    </div>
  );
}
