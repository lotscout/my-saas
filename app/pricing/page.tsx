'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useUserTier } from '@/hooks/useUserTier';

// Shared responsive grid: feature-label column + 3 tier columns.
// fr units always fit the container width, so the table never overflows horizontally.
const GRID_CLS = 'grid grid-cols-[1.5fr_1fr_1fr_1fr]';

// Full feature list — every tier shows all rows; unavailable rows render dimmed.
const FEATURES = [
  { name: 'Unlimited Scout AI Search',                       standard: true,  priority: true,  exclusive: true  },
  { name: 'Land Marketplace Access',                         standard: true,  priority: true,  exclusive: true  },
  { name: 'Lot to Buyer Match AI',                           standard: true,  priority: true,  exclusive: true  },
  { name: 'Custom Company Profile',                          standard: true,  priority: true,  exclusive: true  },
  { name: 'Buyer Directory Access',                          standard: true,  priority: true,  exclusive: true  },
  { name: 'Property Analysis Reports',                       standard: true,  priority: true,  exclusive: true  },
  { name: 'Lot Analysis Reports',                            standard: true,  priority: true,  exclusive: true  },
  { name: 'Unlimited Listings',                              standard: false, priority: true,  exclusive: true  },
  { name: 'Promoted Lot Requests',                           standard: false, priority: true,  exclusive: true  },
  { name: 'Financing Partners Access',                       standard: false, priority: true,  exclusive: true  },
  { name: '24/7 Support',                                    standard: false, priority: true,  exclusive: true  },
  { name: 'Dedicated Full-Time Account Manager',             standard: false, priority: false, exclusive: true  },
  { name: 'Early Access to New Listings',                    standard: false, priority: false, exclusive: true  },
  { name: 'Early Access to New Buyers',                      standard: false, priority: false, exclusive: true  },
  { name: 'Hands-On Listing Support and Deal Guidance',      standard: false, priority: false, exclusive: true  },
  { name: 'White-Glove Onboarding and Setup',                standard: false, priority: false, exclusive: true  },
];

const KEY_FEATURES = {
  standard: ['3 listings/month', '24hr property reports', 'Marketplace + buyer directory', 'Scout AI access'],
  priority: ['Unlimited listings', '15min property reports', 'Promoted lot requests', '24/7 support'],
  exclusive: ['Everything in Priority', 'Financing partners', 'Dedicated account manager', 'White-glove onboarding'],
};

function Check() {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ backgroundColor: '#1D9E75', width: '18px', height: '18px' }}
    >
      <span className="material-symbols-outlined text-white" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>check</span>
    </span>
  );
}

function Dash() {
  return <span className="text-outline-variant text-base">—</span>;
}

// Correct monthly prices. Annual = 9 months paid (3 months free = 25% off).
const MONTHLY_PRICES   = { standard: 97,  priority: 197,  exclusive: 529  };
const ANNUAL_EFFECTIVE = { standard: 73,  priority: 148,  exclusive: 397  }; // effective $/mo
const ANNUAL_TOTALS    = { standard: 873, priority: 1773, exclusive: 4761 }; // billed /yr

// Full feature list rendered in every mobile pricing card. Features not included
// in the tier are dimmed (opacity-40) with a dash instead of a green check.
function TierFeatures({ tier, dark = false }: { tier: 'standard' | 'priority' | 'exclusive'; dark?: boolean }) {
  return (
    <ul className="mt-4 space-y-2">
      {FEATURES.map((f) => {
        const included = f[tier] === true;
        return (
          <li
            key={f.name}
            className={`flex items-center gap-2 text-sm ${dark ? 'text-emerald-50' : 'text-on-surface'} ${included ? '' : 'opacity-40'}`}
          >
            {included ? (
              <span className="inline-flex items-center justify-center rounded-full shrink-0" style={{ backgroundColor: '#1D9E75', width: '18px', height: '18px' }}>
                <span className="material-symbols-outlined text-white" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>check</span>
              </span>
            ) : (
              <span
                className={`material-symbols-outlined text-base shrink-0 ${dark ? 'text-emerald-200' : 'text-secondary'}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                remove
              </span>
            )}
            {f.name}
          </li>
        );
      })}
    </ul>
  );
}

function KeyFeatures({ tier, dark = false }: { tier: keyof typeof KEY_FEATURES; dark?: boolean }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {KEY_FEATURES[tier].map((feature) => (
        <li key={feature} className={`flex items-center gap-2 text-sm font-medium ${dark ? 'text-emerald-50' : 'text-on-surface'}`}>
          <Check />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedMobileTier, setExpandedMobileTier] = useState<'standard' | 'priority' | 'exclusive' | null>(null);
  const { tier: userTier } = useUserTier();

  const prices = isAnnual ? ANNUAL_EFFECTIVE : MONTHLY_PRICES;

  function billingSubtext(tier: keyof typeof ANNUAL_TOTALS) {
    return isAnnual
      ? `Billed $${ANNUAL_TOTALS[tier]}/yr`
      : 'Billed monthly · no commitment';
  }

  function getPriceKey(tier: string) {
    return `${tier}${isAnnual ? 'Annual' : 'Monthly'}`;
  }

  async function handleCheckout(priceKey: string) {
    setLoading(priceKey);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        alert(`Checkout error: ${data.error ?? 'No URL returned'}`);
        setLoading(null);
      }
    } catch (err) {
      alert(`Checkout error: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(null);
    }
  }

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col overflow-x-hidden">
      <Header />

      <main className="flex-grow pt-20 pb-4 px-4 sm:px-6 max-w-6xl mx-auto w-full">

        {/* ── Mobile stacked tier cards ── */}
        <div className="md:hidden space-y-5">
          <div className="text-center px-2">
            <h1 className="font-headline text-2xl font-extrabold text-primary tracking-tight">Choose your plan</h1>
            <p className="mt-1 text-sm text-secondary">Start with Priority if you want unlimited listings and faster reports.</p>
          </div>

          {/* Billing toggle (shares isAnnual with the desktop table) */}
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center p-1 bg-surface-container-high rounded-full">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${!isAnnual ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${isAnnual ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary'}`}
              >
                Annual
              </button>
            </div>
            <span className="text-emerald-700 text-xs font-bold text-center">Get 3 months free (25% off) with annual billing</span>
          </div>

          {/* PRIORITY — Most Popular */}
          <div className="rounded-3xl p-5 shadow-lg relative text-white" style={{ backgroundColor: '#1b4332' }}>
            <span className="absolute top-4 right-4 bg-emerald-400 text-emerald-950 text-[10px] font-black px-3 py-1 rounded-full tracking-wide uppercase">Best Value</span>
            <p className="text-emerald-200 font-bold text-sm tracking-widest uppercase mb-2">Priority</p>
            {isAnnual && <del className="text-emerald-200/40 text-sm font-medium">${MONTHLY_PRICES.priority}/mo</del>}
            <div className="flex items-baseline gap-1 mb-0.5">
              <span className="text-4xl font-extrabold text-white font-headline">${prices.priority}</span>
              <span className="text-emerald-200 font-medium text-sm">/mo</span>
            </div>
            {isAnnual && <p className="text-xs text-emerald-300 font-semibold mb-0.5">Save 25% · 3 months free</p>}
            <p className="text-xs text-emerald-200/70 mb-4">{billingSubtext('priority')}</p>
            <button
              onClick={() => handleCheckout(getPriceKey('priority'))}
              disabled={!!loading || userTier === 'priority'}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 ${userTier === 'priority' ? 'bg-emerald-900 text-emerald-200 cursor-default' : 'bg-emerald-300 text-emerald-950 hover:bg-emerald-200'}`}
            >
              {userTier === 'priority' ? 'Current Plan' : loading === getPriceKey('priority') ? 'Loading…' : 'Get Priority'}
            </button>
            <KeyFeatures tier="priority" dark />
            <button
              type="button"
              onClick={() => setExpandedMobileTier(expandedMobileTier === 'priority' ? null : 'priority')}
              className="mt-4 w-full text-center text-xs font-bold text-emerald-200 underline underline-offset-4"
            >
              {expandedMobileTier === 'priority' ? 'Hide all features' : 'See all features'}
            </button>
            {expandedMobileTier === 'priority' && <TierFeatures tier="priority" dark />}
          </div>

          {/* STANDARD */}
          <div className="bg-white rounded-3xl border border-outline-variant/20 p-5 shadow-sm">
            <p className="text-secondary font-bold text-sm tracking-widest uppercase mb-2">Standard</p>
            {isAnnual && <del className="text-secondary/40 text-sm font-medium">${MONTHLY_PRICES.standard}/mo</del>}
            <div className="flex items-baseline gap-1 mb-0.5">
              <span className="text-4xl font-extrabold text-primary font-headline">${prices.standard}</span>
              <span className="text-secondary font-medium text-sm">/mo</span>
            </div>
            {isAnnual && <p className="text-xs text-emerald-700 font-semibold mb-0.5">Save 25% · 3 months free</p>}
            <p className="text-xs text-secondary/70 mb-4">{billingSubtext('standard')}</p>
            <button
              onClick={() => handleCheckout(getPriceKey('standard'))}
              disabled={!!loading || userTier === 'standard'}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 ${userTier === 'standard' ? 'bg-surface-container-high text-secondary cursor-default' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
            >
              {userTier === 'standard' ? 'Current Plan' : loading === getPriceKey('standard') ? 'Loading…' : 'Get Standard'}
            </button>
            <KeyFeatures tier="standard" />
            <button
              type="button"
              onClick={() => setExpandedMobileTier(expandedMobileTier === 'standard' ? null : 'standard')}
              className="mt-4 w-full text-center text-xs font-bold text-primary underline underline-offset-4"
            >
              {expandedMobileTier === 'standard' ? 'Hide all features' : 'See all features'}
            </button>
            {expandedMobileTier === 'standard' && <TierFeatures tier="standard" />}
          </div>

          {/* EXCLUSIVE */}
          <div className="bg-white rounded-3xl border border-outline-variant/20 p-5 shadow-sm">
            <p className="text-secondary font-bold text-sm tracking-widest uppercase mb-2">Exclusive</p>
            {isAnnual && <del className="text-secondary/40 text-sm font-medium">${MONTHLY_PRICES.exclusive}/mo</del>}
            <div className="flex items-baseline gap-1 mb-0.5">
              <span className="text-4xl font-extrabold text-primary font-headline">${prices.exclusive}</span>
              <span className="text-secondary font-medium text-sm">/mo</span>
            </div>
            {isAnnual && <p className="text-xs text-emerald-700 font-semibold mb-0.5">Save 25% · 3 months free</p>}
            <p className="text-xs text-secondary/70 mb-4">{billingSubtext('exclusive')}</p>
            <button
              onClick={() => handleCheckout(getPriceKey('exclusive'))}
              disabled={!!loading || userTier === 'exclusive'}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-60 ${userTier === 'exclusive' ? 'bg-surface-container-high text-secondary cursor-default' : 'hover:opacity-90'}`}
              style={userTier === 'exclusive' ? undefined : { backgroundColor: '#1b4332' }}
            >
              {userTier === 'exclusive' ? 'Current Plan' : loading === getPriceKey('exclusive') ? 'Loading…' : 'Get Exclusive'}
            </button>
            <KeyFeatures tier="exclusive" />
            <button
              type="button"
              onClick={() => setExpandedMobileTier(expandedMobileTier === 'exclusive' ? null : 'exclusive')}
              className="mt-4 w-full text-center text-xs font-bold text-primary underline underline-offset-4"
            >
              {expandedMobileTier === 'exclusive' ? 'Hide all features' : 'See all features'}
            </button>
            {expandedMobileTier === 'exclusive' && <TierFeatures tier="exclusive" />}
          </div>
        </div>

        {/* ── Desktop comparison table ── */}
        <div className="hidden md:block bg-white rounded-2xl border border-outline-variant/15 overflow-hidden shadow-sm">

          {/* ── Header row ── */}
          <div className={`${GRID_CLS} border-b border-outline-variant/10`}>

            {/* Top-left: billing toggle */}
            <div className="p-5 flex flex-col justify-center gap-2">
              <div className="inline-flex items-center p-1 bg-surface-container-high rounded-full self-start">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    !isAnnual ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary hover:text-primary'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    isAnnual ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary hover:text-primary'
                  }`}
                >
                  Annual
                </button>
              </div>
              <span className="text-green-700 text-xs font-bold pl-1">Get 3 months free (25% off) with annual billing</span>
            </div>

            {/* Standard */}
            <div className="p-5 flex flex-col border-l border-outline-variant/10">
              <span className="text-secondary font-bold text-xs tracking-widest uppercase mb-2">Standard</span>
              {isAnnual && <del className="text-secondary/40 text-sm font-medium mt-1">${MONTHLY_PRICES.standard}/mo</del>}
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-3xl font-extrabold text-primary font-headline">${prices.standard}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              {isAnnual && <p className="text-xs text-emerald-700 font-semibold mb-0.5">Save 25% · 3 months free</p>}
              <p className="text-xs text-secondary/70 mb-4">{billingSubtext('standard')}</p>
              <button
                onClick={() => handleCheckout(getPriceKey('standard'))}
                disabled={!!loading || userTier === 'standard'}
                className={`mt-auto w-full py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60 ${
                  userTier === 'standard'
                    ? 'bg-surface-container-high text-secondary cursor-default'
                    : 'border-2 border-primary text-primary hover:bg-primary/5'
                }`}
              >
                {userTier === 'standard' ? 'Current Plan' : loading === getPriceKey('standard') ? 'Loading…' : 'Get Started'}
              </button>
            </div>

            {/* Priority — highlighted */}
            <div className="p-5 flex flex-col border-l border-outline-variant/10 bg-primary-container/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-primary font-bold text-xs tracking-widest uppercase">Priority</span>
                {userTier === 'priority' ? (
                  <span className="text-secondary text-xs font-semibold">Current Plan</span>
                ) : (
                  <span className="bg-green-700 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-wide uppercase">Most Popular</span>
                )}
              </div>
              {isAnnual && <del className="text-secondary/40 text-sm font-medium">${MONTHLY_PRICES.priority}/mo</del>}
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-3xl font-extrabold text-primary font-headline">${prices.priority}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              {isAnnual && <p className="text-xs text-emerald-700 font-semibold mb-0.5">Save 25% · 3 months free</p>}
              <p className="text-xs text-secondary/70 mb-4">{billingSubtext('priority')}</p>
              <button
                onClick={() => handleCheckout(getPriceKey('priority'))}
                disabled={!!loading || userTier === 'priority'}
                className={`mt-auto w-full py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60 ${
                  userTier === 'priority'
                    ? 'bg-surface-container-high text-secondary cursor-default'
                    : 'bg-green-700 text-white hover:bg-green-800'
                }`}
              >
                {userTier === 'priority' ? 'Current Plan' : loading === getPriceKey('priority') ? 'Loading…' : 'Get Started'}
              </button>
            </div>

            {/* Exclusive */}
            <div className="p-5 flex flex-col border-l border-outline-variant/10">
              <span className="text-secondary font-bold text-xs tracking-widest uppercase mb-2">Exclusive</span>
              {isAnnual && <del className="text-secondary/40 text-sm font-medium mt-1">${MONTHLY_PRICES.exclusive}/mo</del>}
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-3xl font-extrabold text-primary font-headline">${prices.exclusive}</span>
                <span className="text-secondary font-medium text-sm">/mo</span>
              </div>
              {isAnnual && <p className="text-xs text-emerald-700 font-semibold mb-0.5">Save 25% · 3 months free</p>}
              <p className="text-xs text-secondary/70 mb-4">{billingSubtext('exclusive')}</p>
              <button
                onClick={() => handleCheckout(getPriceKey('exclusive'))}
                disabled={!!loading || userTier === 'exclusive'}
                className={`mt-auto w-full py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60 ${
                  userTier === 'exclusive'
                    ? 'bg-surface-container-high text-secondary cursor-default'
                    : 'border-2 border-primary text-primary hover:bg-primary/5'
                }`}
              >
                {userTier === 'exclusive' ? 'Current Plan' : loading === getPriceKey('exclusive') ? 'Loading…' : 'Get Started'}
              </button>
            </div>
          </div>

          {/* ── Feature rows ── */}
          {FEATURES.map((feature, fi) => {
            const cell = (val: boolean | string) =>
              typeof val === 'string'
                ? <span className="text-sm font-bold text-primary">{val}</span>
                : val ? <Check /> : <Dash />;
            return (
              <div
                key={fi}
                className={`${GRID_CLS} border-t border-outline-variant/5 hover:bg-surface-container-lowest transition-colors`}
              >
                <div className="py-2 pl-8 pr-4 text-lg font-medium text-on-surface flex items-center">
                  {feature.name}
                </div>
                <div className="py-2 px-4 flex justify-center items-center border-l border-outline-variant/10">
                  {cell(feature.standard)}
                </div>
                <div className="py-2 px-4 flex justify-center items-center border-l border-outline-variant/10 bg-primary-container/5">
                  {cell(feature.priority)}
                </div>
                <div className="py-2 px-4 flex justify-center items-center border-l border-outline-variant/10">
                  {cell(feature.exclusive)}
                </div>
              </div>
            );
          })}

        </div>

        {/* Exclusive / custom solution */}
        <div className="mt-8 bg-surface-container-low rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h3 className="font-headline text-lg font-bold text-primary mb-1">Need a custom solution?</h3>
            <p className="text-secondary text-sm">Large brokerage or high-volume team? Let&apos;s build a plan that fits your volume.</p>
          </div>
          <a
            href="mailto:support@lotscout.com"
            className="shrink-0 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all active:scale-95"
          >
            Contact Sales
          </a>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-emerald-950 w-full py-4 px-8 mt-auto text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center max-w-7xl mx-auto">
          <div>
            <div className="text-xl font-bold text-emerald-50 mb-2 font-headline">LotScout</div>
            <p className="text-emerald-300/60 leading-relaxed max-w-sm">
              Precision cartography tools for the next generation of land acquisition experts.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <a className="block text-emerald-300/60 hover:text-emerald-50 hover:underline transition-opacity" href="#">Terms of Service</a>
              <a className="block text-emerald-300/60 hover:text-emerald-50 hover:underline transition-opacity" href="#">Privacy Policy</a>
            </div>
            <div className="space-y-2">
              <a className="block text-emerald-300/60 hover:text-emerald-50 hover:underline transition-opacity" href="#">Data Sources</a>
              <a className="block text-emerald-300/60 hover:text-emerald-50 hover:underline transition-opacity" href="#">Contact Support</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-emerald-900 mt-4 pt-3 text-center text-emerald-200/40">
          © 2024 LotScout Digital Cartography. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
